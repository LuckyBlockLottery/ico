const LBTContract = artifacts.require("./LuckyBucks.sol");
const ExchangeContract = artifacts.require("./Exchange.sol");
const TTContract = artifacts.require("./TestToken.sol");

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Exchange tests', async (accounts) => {

    let LBT;
    let Exchange;
    let TT;

    beforeEach(async () => {
        LBT = await LBTContract.deployed();
        Exchange = await ExchangeContract.deployed();
        TT = await TTContract.deployed();
    });

    describe('Initial state test', () => {

        it('stableCoin address test', async () => {
            let coin = TT.address;
            let coinFromContract = await Exchange.stableCoin.call();

            assert.equal(coin, coinFromContract, 'StableCoin is not correct!');
        });

        it('exchangeLimit test', async () => {
            let exchangeLimit = 1000;
            let exchangeLimitFromContract = await Exchange.exchangeLimit.call();

            assert.equal(exchangeLimit, exchangeLimitFromContract, 'Token is not correct!');
        });

    });

    describe('setExchangeLimit test from owner', () => {

        it('setExchangeLimit test', async () => {
            let limit = 1001;
            await Exchange.setExchangeLimit(limit);
            let exchangeLimitFromContract = await Exchange.exchangeLimit.call();
            assert.equal(limit, exchangeLimitFromContract, 'exchangeLimit is not correct!');
        });

        it('setExchangeLimit from not owner', async () => {
            let err;
            try {
                await Exchange.setExchangeLimit(1000, {from: accounts[1]});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

    });

    describe('deposit function test', () => {

        let user = accounts[5];
        let value = 1000;

        before(async () => {
            await LBT.addManager(accounts[0]);
            await LBT.addManager(Exchange.address);
            await LBT.mint(user, 10000);
            await LBT.mint(Exchange.address, 10000);
            await TT.mint(Exchange.address, 10000);
        });

        it('deposit without approve', async () => {
            let err;
            try {
                await Exchange.deposit(value, {from: user});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('deposit with approve', async () => {
            let balanceOfUserOfLBTBefore = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTBefore = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTBefore = await TT.balanceOf(user);
            let balanceOfExchangeOfTTBefore = await TT.balanceOf(Exchange.address);
            let depositBefore = await Exchange.getDeposit(user);
            await LBT.approve(Exchange.address, value, {from: user});
            await Exchange.deposit(value, {from: user});
            let balanceOfUserOfLBTAfter = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTAfter = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTAfter = await TT.balanceOf(user);
            let balanceOfExchangeOfTTAfter = await TT.balanceOf(Exchange.address);
            let depositAfter = await Exchange.getDeposit(user);
            assert.equal(balanceOfUserOfLBTBefore-balanceOfUserOfLBTAfter, value, 'Balance of user of LBT is not correct!');
            assert.equal(balanceOfExchangeOfLBTAfter-balanceOfExchangeOfLBTBefore, value, 'Balance of contract of LBT is not correct!');
            assert.equal(balanceOfUserOfTTBefore-balanceOfUserOfTTAfter, 0, 'Balance of user of TT is not correct!');
            assert.equal(balanceOfExchangeOfTTBefore-balanceOfExchangeOfTTAfter, 0, 'Balance of contract of TT is not correct!');
            assert.equal(depositAfter-depositBefore, value, 'Deposit is not correct!');
        });
    });

    describe('refundDeposit function test', () => {

        let user = accounts[5];
        let value = 100;

        it('refundDeposit with amount is more than deposit', async () => {
            let err;
            try {
                await Exchange.refundDeposit(value*100, {from: user});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('refundDeposit with amount is less than deposit', async () => {
            let balanceOfUserOfLBTBefore = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTBefore = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTBefore = await TT.balanceOf(user);
            let balanceOfExchangeOfTTBefore = await TT.balanceOf(Exchange.address);
            let depositBefore = await Exchange.getDeposit(user);
            await Exchange.refundDeposit(value, {from: user});
            let balanceOfUserOfLBTAfter = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTAfter = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTAfter = await TT.balanceOf(user);
            let balanceOfExchangeOfTTAfter = await TT.balanceOf(Exchange.address);
            let depositAfter = await Exchange.getDeposit(user);
            assert.equal(balanceOfUserOfLBTAfter-balanceOfUserOfLBTBefore, value, 'Balance of user of LBT is not correct!');
            assert.equal(balanceOfExchangeOfLBTBefore-balanceOfExchangeOfLBTAfter, value, 'Balance of contract of LBT is not correct!');
            assert.equal(balanceOfUserOfTTBefore-balanceOfUserOfTTAfter, 0, 'Balance of user of TT is not correct!');
            assert.equal(balanceOfExchangeOfTTBefore-balanceOfExchangeOfTTAfter, 0, 'Balance of contract of TT is not correct!');
            assert.equal(depositBefore-depositAfter, value, 'Deposit is not correct!');
        });
    });

    describe('withdraw function test', () => {

        let user = accounts[5];
        let value = 100;

        it('withdraw function from not owner', async () => {
            let err;
            try {
                await Exchange.withdraw(user, value, {from: accounts[1]});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('withdraw function from owner with amount is more than deposit', async () => {
            let err;
            try {
                await Exchange.withdraw(value*100);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('withdraw function from owner', async () => {
            let balanceOfUserOfLBTBefore = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTBefore = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTBefore = await TT.balanceOf(user);
            let balanceOfExchangeOfTTBefore = await TT.balanceOf(Exchange.address);
            let depositBefore = await Exchange.getDeposit(user);
            await Exchange.withdraw(user, value);
            let balanceOfUserOfLBTAfter = await LBT.balanceOf(user);
            let balanceOfExchangeOfLBTAfter = await LBT.balanceOf(Exchange.address);
            let balanceOfUserOfTTAfter = await TT.balanceOf(user);
            let balanceOfExchangeOfTTAfter = await TT.balanceOf(Exchange.address);
            let depositAfter = await Exchange.getDeposit(user);
            assert.equal(balanceOfUserOfLBTBefore-balanceOfUserOfLBTAfter, 0, 'Balance of user of LBT is not correct!');
            assert.equal(balanceOfExchangeOfLBTAfter-balanceOfExchangeOfLBTBefore, 0, 'Balance of contract of LBT is not correct!');
            assert.equal(balanceOfUserOfTTAfter-balanceOfUserOfTTBefore, value, 'Balance of user of TT is not correct!');
            assert.equal(balanceOfExchangeOfTTBefore-balanceOfExchangeOfTTAfter, value, 'Balance of contract of TT is not correct!');
            assert.equal(depositBefore-depositAfter, value, 'Deposit is not correct!');
        });
    });
});