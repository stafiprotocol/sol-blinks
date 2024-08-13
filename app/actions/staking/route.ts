import { ActionGetResponse, createActionHeaders } from '@solana/actions';

const headers = createActionHeaders();

export const GET = async (req: Request) => {
	const payload: ActionGetResponse = {
		title: 'Stake SOL to StaFi LSD',
		icon: '',
		description: 'Stake SOL to StaFi LSD',
		label: 'Stake',
		links: {
			actions: [
				{
					label: 'Stake 1 SOL',
					href: '',
				},
				{
					label: 'Stake 5 SOL',
					href: '',
				},
				{
					label: 'Stake 10 SOL',
					href: '',
				},
				{
					label: 'Stake SOL',
					href: '',
					parameters: [
						{
							name: 'amount',
							label: 'Enter the amount of SOL to stake',
							required: true,
						},
					],
				},
			],
		},
	};

	return Response.json(payload, {
		headers,
	});
};

export const OPTIONS = async () => {
	return new Response(null, { headers });
};
