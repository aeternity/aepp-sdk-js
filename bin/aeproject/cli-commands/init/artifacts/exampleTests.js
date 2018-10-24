const Ae = require('@aeternity/aepp-sdk').Cli;

const config = {
	host: "http://localhost:3001/",
	internalHost: "http://localhost:3001/internal/",
	ownerKeyPair: {
		priv: 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca',
		pub: 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU'
	},
	pubKeyHex: '0xe9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca',
}

describe('ERC721', () => {

	let firstClient;

	before(async () => {
		firstClient = await Ae({
			url: config.host,
			internalUrl: config.internalHost,
			keypair: config.ownerKeyPair
		});

	})

	it('some test', async () => {
		// some test logic
	})

})