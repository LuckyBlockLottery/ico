const SaleContract = artifacts.require("./Sale.sol");

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Other tests', async (accounts) => {

    let Sale;

    beforeEach(async () => {
        Sale = await SaleContract.deployed();
    });

    describe('SafeMath mul test test', () => {
        it('SafeMath mul test test', async () => {
            let value = 0;
            let amount = await Sale.checkTokensAmount(value);
            assert.equal(value, amount, 'Amount is not correct!');
        });
    });
});
