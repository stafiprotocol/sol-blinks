import express from 'express';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { createPostResponse, actionCorsMiddleware } from '@solana/actions';
import { IDL } from './config/idl/lsd_program.js';
import { solanaPrograms, solanaRestEndpoint, PORT } from './config/index.js';
import { getSplTokenAccount } from './utils/solanaUtils.js';
import anchorPkg, { Wallet } from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { StakeActions } from './config/actions.js';

const { BN, Program, AnchorProvider } = anchorPkg;

const DEFAULT_SOL_ADDRESS = Keypair.generate().publicKey;
const DEFAULT_SOL_AMOUNT = 1;

// Express app setup
const app = express();
app.use(express.json());

app.use(actionCorsMiddleware());

// Routes
app.get('/actions.json', getActionsJson);
app.get('/api/actions/stake', getStakeSol);
app.post('/api/actions/stake', postStakeSol);

// Route handlers
function getActionsJson(req, res) {
  const payload = {
    rules: [
      { pathPattern: '/*', apiPath: '/api/actions/*' },
      { pathPattern: '/api/actions/**', apiPath: '/api/actions/**' },
    ],
  };
  res.json(payload);
}

async function getStakeSol(req, res) {
  try {
    const baseHref = `http://${req.headers.host}/api/actions/stake`;

    const actions = [];
    for (let action of StakeActions) {
      if (action.customAmount) {
        actions.push({
          label: action.label,
          href: `${baseHref}?amount={amount}`,
          parameters: [
            {
              name: 'amount',
              label: action.placeholder || 'Enter the amount of SOL to stake',
              required: true,
            },
          ],
        });
      } else {
        actions.push({
          label: action.label,
          href: `${baseHref}?amount=${action.amount}`,
        });
      }
    }

    const payload = {
      title: 'Stake SOL to StaFi LSD',
      icon: 'https://solana-actions.vercel.app/solana_devs.jpg',
      description: 'Stake SOL to StaFi LSD',
      label: 'Stake',
      links: {
        actions,
      },
    };

    res.json(payload);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err?.message || err });
  }
}

async function postStakeSol(req, res) {
  try {
    const { amount } = validatedQueryParams(req.query);

    const { account } = req.body;

    if (!account) {
      throw new Error('Invalid "account" provided');
    }
    const fromPubkey = new PublicKey(account);

    const connection = new Connection(solanaRestEndpoint);
    const wallet = new Wallet(new Keypair());
    const provider = new AnchorProvider(connection, wallet);
    anchorPkg.setProvider(provider);

    const lsdProgramPubKey = new PublicKey(solanaPrograms.lsdProgramId);
    const stakeManagerPubKey = new PublicKey(
      solanaPrograms.stakeManagerAccountAddress
    );
    const lsdTokenMintPubKey = new PublicKey(solanaPrograms.lsdTokenMint);

    const [stakePoolPubKey] = PublicKey.findProgramAddressSync(
      [stakeManagerPubKey.toBuffer(), Buffer.from('pool_seed')],
      lsdProgramPubKey
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: fromPubkey,
      blockhash,
      lastValidBlockHeight,
    });

    let ata = await getAssociatedTokenAddress(lsdTokenMintPubKey, fromPubkey);
    const userSplTokenAddress = await getSplTokenAccount(
      connection,
      account,
      solanaPrograms.lsdTokenMint
    );

    if (!userSplTokenAddress) {
      const ataInstruction = createAssociatedTokenAccountInstruction(
        fromPubkey,
        ata,
        fromPubkey,
        lsdTokenMintPubKey
      );
      transaction.add(ataInstruction);
    }

    const anchorProgram = new Program(IDL, lsdProgramPubKey);
    const anchorInstruction = await anchorProgram.methods
      .stake(new BN((Number(amount) * 1000000000).toFixed(0)))
      .accounts({
        stakeManager: stakeManagerPubKey,
        stakePool: stakePoolPubKey,
        from: fromPubkey,
        lsdTokenMint: lsdTokenMintPubKey,
        mintTo: ata,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    transaction.add(anchorInstruction);
    transaction.rpc = solanaRestEndpoint;

    const payload = await createPostResponse({
      fields: {
        transaction,
        message: `Stake ${amount} SOL to StaFi`,
      },
    });

    res.json(payload);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message || 'An unknown error occurred' });
  }
}

function validatedQueryParams(query) {
  let toPubkey = DEFAULT_SOL_ADDRESS;
  let amount = DEFAULT_SOL_AMOUNT;

  if (query.to) {
    try {
      toPubkey = new PublicKey(query.to);
    } catch (err) {
      throw new Error('Invalid input query parameter: to');
    }
  }

  try {
    if (query.amount) {
      amount = parseFloat(query.amount);
    }
    if (amount <= 0) throw new Error('amount is too small');
  } catch (err) {
    throw new Error('Invalid input query parameter: amount');
  }

  return { amount, toPubkey };
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
