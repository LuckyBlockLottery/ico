const LBTContract = artifacts.require("./LuckyBucks.sol");
const RoundContract = artifacts.require("./Round.sol");

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Round tests', async (accounts) => {

    let LBT;
    let Round;

    beforeEach(async () => {
        LBT = await LBTContract.deployed();
        Round = await RoundContract.deployed();
    });

    describe('Initial state test', () => {

        it('Lottery address test', async () => {
            let lottery = accounts[0];
            let lotteryInContract = await Round.lottery.call();

            assert.equal(lottery, lotteryInContract, 'Lottery is not correct!');
        });

        it('Token test', async () => {
            let token = LBT.address;
            let tokenInContract = await Round.token.call();

            assert.equal(token, tokenInContract, 'Token is not correct!');
        });

    });

    describe('hash function test', () => {
        it('hash function with numbers', async () => {
           let a = 1;
           let b = 2;
           let c = 3;
           let d = 4;
           let e = 5;
           let hash = web3.utils.soliditySha3(a, b, c, d, e);
           let hashFromContract = await Round.hash(a, b, c, d, e);

           assert.equal(hash, hashFromContract, 'Hash is not correct!');
        });

        it('hash function with not numbers', async () => {
            let a = 'one';
            let b = 'two';
            let c = 'three';
            let d = 'four';
            let e = 'five';
            let err;
            try {
                await Round.hash(a, b, c, d, e);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });
    });

    describe('checkHash function test', () => {

        let a = 1;
        let b = 2;
        let c = 3;
        let d = 4;
        let e = 5;
        let wrongA = 0;
        let wrongTypeA = 'one';

        before(async () => {
           await Round.setHash(a, b, c, d, e);
        });

        it('checkHash function test with right numbers', async () => {
            let result = await Round.checkHash(a, b, c, d, e);

            assert.isTrue(result, 'Result is not correct!');
        });

        it('checkHash function test with wrong numbers', async () => {
            let result = await Round.checkHash(wrongA, b, c, d, e);

            assert.isFalse(result, 'Result is not correct!');
        });

        it('checkHash function test with wrong type', async () => {
            let err;
            try {
                await Round.checkHash(wrongTypeA, b, c, d, e);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });
    });

    describe('sendTokens function test', () => {

        let a = 1;
        let b = 2;
        let c = 3;
        let d = 4;
        let e = 5;
        let wrongA = 0;
        let wrongTypeA = 'one';
        let beneficiary = accounts[9];
        let amount = 10000;
        let balanceBefore;

        before(async () => {
            LBT.addManager(Round.address);
        });

        beforeEach(async () => {
            balanceBefore = await LBT.balanceOf(beneficiary);
        });

        it('sendTokens function test with right numbers', async () => {
            await Round.sendTokens(a, b, c, d, e, beneficiary, amount);
            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, amount, 'Balance is not correct!');
        });

        it('sendTokens function test with not right numbers', async () => {
            let err;
            try {
                await Round.sendTokens(wrongA, b, c, d, e, beneficiary, amount);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);

            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });

        it('sendTokens function test with not right type', async () => {
            let err;
            try {
                await Round.sendTokens(wrongTypeA, b, c, d, e, beneficiary, amount);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);

            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });

        it('sendTokens function test with not right msg.sender', async () => {
            let err;
            try {
                await Round.sendTokens(a, b, c, d, e, beneficiary, amount, {from: accounts[1]});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);

            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });

        it('sendTokens function test with not right beneficiary', async () => {
            let err;
            try {
                await Round.sendTokens(a, b, c, d, e, 0, amount);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);

            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });

        it('sendTokens function test with not right amount', async () => {
            let err;
            try {
                await Round.sendTokens(a, b, c, d, e, beneficiary, 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });

        it('sendTokens function test when Round isn\'t manager of LBT', async () => {
            await LBT.removeManager(Round.address);
            let err;
            try {
                await Round.sendTokens(a, b, c, d, e, beneficiary, amount);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
            let balanceAfter = await LBT.balanceOf(beneficiary);

            assert.equal(balanceAfter-balanceBefore, 0, 'Balance is not correct!');
        });
    });

});