const LBTContract = artifacts.require("./LuckyBucks.sol");
const SaleContract = artifacts.require("./Sale.sol");
const TestTokenContract = artifacts.require("./TestToken.sol");

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Sale tests', async (accounts) => {

    let LBT;
    let Sale;

    beforeEach(async () => {
        LBT = await LBTContract.deployed();
        Sale = await SaleContract.deployed();
    });

    describe('Initial state test', () => {
        it('rate', async () => {
            let rate = 100;
            let rateInContract = await Sale.rate.call();

            assert.equal(rate, rateInContract, 'Rate is not correct!');
        });

        it('wallet', async () => {
            let wallet =  '0x3C5459BCDE2D5c1eDc4Cc6C6547d6cb360Ce5aE9';
            let walletInContract = await Sale.wallet.call();

            assert.equal(wallet, walletInContract, 'Wallet is not correct!');
        });

        it('token', async () => {
            let token =  LBT.address;
            let tokenInContract = await Sale.token.call();

            assert.equal(token, tokenInContract, 'Wallet is not correct!');
        });
    });

    describe('sendEth function test', () => {
        it('sendEth function', async () => {
            let balanceBefore = await web3.eth.getBalance(Sale.address);
            await Sale.sendEth({value: web3.utils.toWei("1", "ether")});
            let balanceAfter = await web3.eth.getBalance(Sale.address);

            assert.equal(balanceAfter-balanceBefore, web3.utils.toWei("1", "ether"), "Balance isn't 1 ether!");
        });
    });

    describe('Fallback function test', () => {

        let rate = 1000;
        let amount = web3.utils.toWei('5', 'ether');
        let coins = amount*rate/1000/0.001;
        let coins2 = amount*rate/1000/0.002;
        let coins100 = amount*rate/1000/1;

        before(async () => {
            await LBT.addManager(Sale.address);
        });

        it('fallback function with price = 1', async () => {
            let account = accounts[6];
            let wallet = await Sale.wallet.call();
            let balanceBefore = await LBT.balanceOf(account);
            let balanceWalletBefore = await web3.eth.getBalance(wallet);
            await Sale.sendTransaction({from: account, value: amount});
            let balanceAfter = await LBT.balanceOf(account);
            let balanceWalletAfter = await web3.eth.getBalance(wallet);

            assert.equal(balanceAfter-balanceBefore, coins, 'Balance of account is not correct!');
            assert.equal(balanceWalletAfter-balanceWalletBefore, amount, 'Balance of wallet is not correct!');
        });


        it('fallback function wiuth price = 2', async () => {
            let account = accounts[7];
            let wallet = await Sale.wallet.call();
            let balanceBefore = await LBT.balanceOf(account);
            let balanceWalletBefore = await web3.eth.getBalance(wallet);
            await Sale.sendTransaction({from: account, value: amount});
            let balanceAfter = await LBT.balanceOf(account);
            let balanceWalletAfter = await web3.eth.getBalance(wallet);

            assert.equal(balanceAfter-balanceBefore, coins2, 'Balance of account is not correct!');
            assert.equal(balanceWalletAfter-balanceWalletBefore, amount, 'Balance of wallet is not correct!');
        });

        it('fallback function wiuth price = 1000', async () => {
            let account = accounts[8];
            let wallet = await Sale.wallet.call();
            let balanceBefore = await LBT.balanceOf(account);
            let balanceWalletBefore = await web3.eth.getBalance(wallet);
            await Sale.sendTransaction({from: account, value: amount});
            let balanceAfter = await LBT.balanceOf(account);
            let balanceWalletAfter = await web3.eth.getBalance(wallet);

            assert.equal(balanceAfter-balanceBefore, coins100, 'Balance of account is not correct!');
            assert.equal(balanceWalletAfter-balanceWalletBefore, amount, 'Balance of wallet is not correct!');
        });

        it('fallback function with wrong amount', async () => {
            let wrongAmount = 0;
            let err;
            try {
                await Sale.sendTransaction({from: account, value: wrongAmount});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('fallback function with wrong beneficiary address', async () => {
            let wrongAddress = 0;
            let err;
            try {
                await Sale.buyTokens(wrongAddress, {value: amount});
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });
    });

    describe('checkTokensAmount function test', () => {

        it('checkTokensAmount function', async () => {
            let amount = 1000;
            let rate = 100;
            let tokensAmount = amount*rate/100;
            let tokensAmountFromContract = await Sale.checkTokensAmount(amount);

            assert.equal(tokensAmount, tokensAmountFromContract.valueOf(), 'Tokens amount is not correct!');
        });

    });

    describe('withdraw function test', () => {

        it('withdraw function from not owner', async () => {
            let err;
            try {
                await Sale.withdraw(web3.utils.toWei("0.5", "ether"), {from: accounts[1]});
            } catch (e) {
                err = e;
            }

            assert.ok(err instanceof Error);
        });

        it('withdraw function from owner', async () => {
            let amount = web3.utils.toWei("0.5", "ether");
            let balanceBefore = await web3.eth.getBalance(accounts[1]);
            await Sale.withdrawETH(accounts[1], amount);
            let balanceAfter = await web3.eth.getBalance(accounts[1]);

            assert.equal(balanceAfter-balanceBefore, amount, 'Balance is not correct!');
        });

    });

    describe('Oraclize functions', () => {

        it('setUrl function test', async () => {
            let url = 'url';
            await Sale.setUrl(url);
            let _url = await Sale.url.call();
            assert.equal(url, _url, 'Url is incorrect');
        });

        it('setTimeout function test', async () => {
            let timeout = 100;
            await Sale.setTimeout(timeout);
            let _timeout = await Sale.timeout.call();
            assert.equal(timeout, _timeout, 'Timeout is incorrect');
        });

        it('setGasLimit function test', async () => {
            let gasLimit = 100;
            await Sale.setGasLimit(gasLimit);
            let _gasLimit = await Sale.gasLimit.call();
            assert.equal(gasLimit, _gasLimit, 'GasLimit is incorrect');
        });

        it('update function with gasPrice is more than balance test', async () => {
            let balance = await web3.eth.getBalance(Sale.address);
            await Sale.setOraclizePrice(balance+1);
            let res = await Sale.update();
            let txEvent = findEvent(res.logs, 'NewOraclizeQuery');
            let descr = "Oraclize query was NOT sent, please add some ETH to cover for the query fee";
            assert.equal(txEvent.args.description, descr, 'Event is incorrect');
        });

        it('update function with gasPrice is less than balance test', async () => {
            await Sale.setOraclizePrice(0);
            let res = await Sale.update();
            let txEvent = findEvent(res.logs, 'NewOraclizeQuery');
            let descr = "Oraclize query was sent, standing by for the answer..";
            assert.equal(txEvent.args.description, descr, 'Event is incorrect');
        });

        it('callback function  test', async () => {
            await Sale.setMyOraclize(accounts[0]);
            let res = await Sale.__callback('0x0', '100.00');
            let txEventRate = findEvent(res.logs, 'NewPrice');
            let txEventQuery = findEvent(res.logs, 'NewOraclizeQuery');
            let descr = "Oraclize query was sent, standing by for the answer..";
            assert.equal(txEventRate.args.price, 10000, 'Price is incorrect');
            assert.equal(txEventQuery.args.description, descr, 'Event is incorrect');
        });


    });

    describe('other function', () => {


        it('reclaimToken function test', async () => {
            let TestToken = await TestTokenContract.deployed();
            await TestToken.mint(Sale.address, 100);
            let balanceSaleBefore = await TestToken.balanceOf(Sale.address);
            let balanceOwnerBefore = await TestToken.balanceOf(accounts[0]);
            await Sale.reclaimToken(TestToken.address);
            let balanceSaleAfter = await TestToken.balanceOf(Sale.address);
            let balanceOwnerAfter = await TestToken.balanceOf(accounts[0]);
            assert.equal(balanceSaleBefore - balanceSaleAfter, 100, 'Sale balance is incorrect');
            assert.equal(balanceOwnerAfter - balanceOwnerBefore, 100, 'Owner balance is incorrect');


        });
    });

});

function findEvent(logs, eventName) {
    let result = null;
    for (let log of logs) {
        if (log.event === eventName) {
            result = log;
            break;
        }
    }
    return result;
};