const LBTContract = artifacts.require("./LuckyBucks.sol");
const TestTokenContract = artifacts.require("./TestToken.sol");

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();
  
contract('LBT tests', async (accounts) => {

    let LBT;
    let TestToken;

    beforeEach(async () => {
        LBT = await LBTContract.deployed();
        TestToken = await TestTokenContract.deployed();
    });

    describe('Initial state test', () => {

        it('name() function', async () => {
            let name = 'Lucky Bucks';
            let nameFromContract = await LBT.name();

            assert.equal(name, nameFromContract, 'Name is wrong!');
        });

        it('symbol() function', async () => {
            let symbol = 'LBT';
            let symbolFromContract = await LBT.symbol();

            assert.equal(symbol, symbolFromContract, 'Symbol is wrong!');
        });

        it('decimals() function', async () => {
            let decimals = 18;
            let decimalsFromContract = await LBT.decimals();

            assert.equal(decimals, decimalsFromContract, 'Decimals is wrong!');
        });

        it('totalSupply() function', async () => {
            let totalSupply = 1000000000 * 10 ** 18;
            let totalSupplyFromContract = await LBT.totalSupply();

            assert.equal(totalSupply, totalSupplyFromContract, 'totalSupply is wrong!');
        });

        it('Balance of owner', async () => {
            let owner = '0x5BAAeC69Ec6602Efb5d9dBf1A192eFe94D0Cd9f8';
            let balance = 1000000000 * 10 ** 18;
            let balanceFromContract = await LBT.balanceOf(owner);

            assert.equal(balance, balanceFromContract, 'Balance is wrong!');
        });

    });

    describe('Allowance test', async () => {

        it('Allowance [account0 => account1] before approve is 0', async () => {
            let allowedFromContract = await LBT.allowance(accounts[0], accounts[1]);
            let allowed = 0;

            assert.equal(allowed, allowedFromContract, 'Allowance is wrong!');
        });

        it('approve function', async () => {
            let value = 10000;
            let approveResult = await LBT.approve(accounts[1], value)

            assert(approveResult, 'Allowance is wrong!');
        });

        it('Allowance [account0 => account1] after approve is 10000', async () => {
            let allowedFromContract = await LBT.allowance(accounts[0], accounts[1]);
            let allowed = 10000;

            assert.equal(allowed, allowedFromContract, 'Allowance is wrong!');
        });

        it('Increase allowed for 10000', async () => {
            let value = 10000;
            let allowedFromContractBefore = await LBT.allowance(accounts[0], accounts[1]);
            await LBT.increaseAllowance(accounts[1], value);
            let allowedFromContractAfter = await LBT.allowance(accounts[0], accounts[1]);

            assert.equal(value, allowedFromContractAfter - allowedFromContractBefore, 'Allowed value is not correct!');
        });

        it('Decrease allowed for 10000', async () => {
            let value = 10000;
            let allowedFromContractBefore = await LBT.allowance(accounts[0], accounts[1]);
            await LBT.decreaseAllowance(accounts[1], value);
            let allowedFromContractAfter = await LBT.allowance(accounts[0], accounts[1]);

            assert.equal(value, allowedFromContractBefore - allowedFromContractAfter, 'Allowed value is not correct!');
        });

    });

    describe('Mint function', () => {

        it('Balance of account0 before mint is 0', async () => {
            let balance = 0;
            let balanceFromContract = await LBT.balanceOf(accounts[0]);

            assert.equal(balance, balanceFromContract, 'Balance isn\'t 0!');
        });

        it('Mint 1000000 tokens to account0 from not manager', async () => {
            let value = 1000000;
            let err;
            try {
                await LBT.mint(accounts[0], value);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('Mint 1000000 tokens to account0 from manager', async () => {
            let value = 1000000;
            let account = accounts[0];
            let balanceBefore = await LBT.balanceOf(account);
            await LBT.addManager(account);
            let isManager = await LBT.getInfo(account);
            await LBT.mint(account, value);
            let balanceAfter = await LBT.balanceOf(account);

            assert.isTrue(isManager, 'Manager is incorrect');
            assert.equal(balanceAfter, value - balanceBefore, 'Balance isn\'t correct!');
        });
    });

    describe('Burn function', () => {

        it('Burn function test', async () => {
            let account = accounts[0];
            let value = 100;
            let balanceBefore = await LBT.balanceOf(account);
            await LBT.burn(value);
            let balanceAfter = await LBT.balanceOf(account);

            assert.equal(balanceBefore-balanceAfter, value, 'Balance isn\'t correct!');
        });

        it('Burn from function test', async () => {
            let account = accounts[0];
            let accountFrom = accounts[1];
            let value = 100;
            await LBT.approve(accountFrom, value);
            let balanceBefore = await LBT.balanceOf(account);
            await LBT.burnFrom(account, value, {from: accountFrom});
            let balanceAfter = await LBT.balanceOf(account);

            assert.equal(balanceBefore-balanceAfter, value, 'Balance isn\'t correct!');
        });

    });

    describe('Transfer functions', () => {
        describe('Transfer when balance is more than value', async () => {
            it('transfer function', async () => {
                let value = 1000;
                let balance0Before = await LBT.balanceOf(accounts[0]);
                let balance1Before = await LBT.balanceOf(accounts[1]);
                await LBT.transfer(accounts[1], value);
                let balance0After = await LBT.balanceOf(accounts[0]);
                let balance1After = await LBT.balanceOf(accounts[1]);

                assert.equal(balance0Before - balance0After, value, 'Balance of accounts0 is not correct!');
                assert.equal(balance1After - balance1Before, value, 'Balance of accounts1 is not correct!');
            });

            it('transferFrom function when allowance is more than value', async () => {
                let value = 1000;
                await LBT.approve(accounts[0], value, {from: accounts[1]});
                let balance1Before = await LBT.balanceOf(accounts[1]);
                let balance2Before = await LBT.balanceOf(accounts[2]);
                let allowanceBefore = await LBT.allowance(accounts[1], accounts[0]);
                await LBT.transferFrom(accounts[1], accounts[2], value);
                let balance1After = await LBT.balanceOf(accounts[1]);
                let balance2After = await LBT.balanceOf(accounts[2]);
                let allowanceAfter = await LBT.allowance(accounts[1], accounts[0]);

                assert.equal(balance1Before - balance1After, value, 'Balance of accounts1 is not correct!');
                assert.equal(balance2After - balance2Before, value, 'Balance of accounts2 is not correct!');
                assert.equal(allowanceBefore - allowanceAfter, value, 'Allowance is not correct!');
            });

            it('transferFrom function when allowance is less than value', async () => {
                let value = 1000;
                let balance1Before = await LBT.balanceOf(accounts[1]);
                let balance2Before = await LBT.balanceOf(accounts[2]);
                let allowanceBefore = await LBT.allowance(accounts[1], accounts[0]);
                let err;
                try {
                    await LBT.transferFrom(accounts[1], accounts[2], value);
                } catch (error) {
                    err = error;
                }
                let balance1After = await LBT.balanceOf(accounts[1]);
                let balance2After = await LBT.balanceOf(accounts[2]);
                let allowanceAfter = await LBT.allowance(accounts[1], accounts[0]);
                assert.ok(err instanceof Error);
                assert.equal(balance1Before - balance1After, 0, 'Balance of accounts1 is not correct!');
                assert.equal(balance2After - balance2Before, 0, 'Balance of accounts2 is not correct!');
                assert.equal(allowanceBefore - allowanceAfter, 0, 'Allowance is not correct!');
            });
        });

        describe('Transfer when balance is less than value', async () => {
            it('transfer function', async () => {
                let value = 1000;
                let balance5Before = await LBT.balanceOf(accounts[5]);
                let balance6Before = await LBT.balanceOf(accounts[6]);
                let err;
                try {
                    await LBT.transfer(accounts[6], value, {from: accounts[5]});
                } catch (error) {
                    err = error;
                }
                let balance5After = await LBT.balanceOf(accounts[5]);
                let balance6After = await LBT.balanceOf(accounts[6]);

                assert.ok(err instanceof Error);
                assert.equal(balance5Before - balance5After, 0, 'Balance of accounts5 is not correct!');
                assert.equal(balance6After - balance6Before, 0, 'Balance of accounts6 is not correct!');
            });

            it('transferFrom function when allowance is less than value', async () => {
                let value = 1000;
                let balance5Before = await LBT.balanceOf(accounts[5]);
                let balance6Before = await LBT.balanceOf(accounts[6]);
                let allowanceBefore = await LBT.allowance(accounts[5], accounts[0]);
                let err;
                try {
                    await LBT.transferFrom(accounts[5], accounts[6], value);
                } catch (error) {
                    err = error;
                }
                let balance5After = await LBT.balanceOf(accounts[5]);
                let balance6After = await LBT.balanceOf(accounts[6]);
                let allowanceAfter = await LBT.allowance(accounts[5], accounts[0]);

                assert.equal(balance5Before - balance6After, 0, 'Balance of accounts5 is not correct!');
                assert.equal(balance6After - balance6Before, 0, 'Balance of accounts6 is not correct!');
                assert.equal(allowanceBefore - allowanceAfter, 0, 'Allowance is not correct!');
            });

            it('transferFrom function when allowance is more than value', async () => {
                let value = 1000;
                await LBT.approve(accounts[0], value, {from: accounts[5]});
                let balance5Before = await LBT.balanceOf(accounts[5]);
                let balance6Before = await LBT.balanceOf(accounts[6]);
                let allowanceBefore = await LBT.allowance(accounts[5], accounts[0]);
                let err;
                try {
                    await LBT.transferFrom(accounts[5], accounts[6], value);
                } catch (error) {
                    err = error;
                }
                let balance5After = await LBT.balanceOf(accounts[5]);
                let balance6After = await LBT.balanceOf(accounts[6]);
                let allowanceAfter = await LBT.allowance(accounts[5], accounts[0]);
                assert.ok(err instanceof Error);
                assert.equal(balance5Before - balance5After, 0, 'Balance of accounts5 is not correct!');
                assert.equal(balance6After - balance6Before, 0, 'Balance of accounts6 is not correct!');
                assert.equal(allowanceBefore - allowanceAfter, 0, 'Allowance is not correct!');
            });
        });
    });

    describe('Tests with incorrect addresses', () => {

        it('approve function with incorrect spender address', async () => {
            let err;
            try {
                await LBT.approve(address(0), 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('increaseAllowance function with incorrect spender address', async () => {
            let err;
            try {
                await LBT.increaseAllowance(address(0), 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('decreaseAllowance function with incorrect spender address', async () => {
            let err;
            try {
                await LBT.decreaseAllowance(address(0), 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('transfer function with incorrect to address', async () => {
            let err;
            try {
                await LBT.transfer(address(0), 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });

        it('mint function with incorrect to address', async () => {
            let err;
            try {
                await LBT.mint(address(0), 0);
            } catch (error) {
                err = error;
            }
            assert.ok(err instanceof Error);
        });
    });

    describe('other function', () => {

        it('reclaimToken function test', async () => {
           await TestToken.mint(LBT.address, 100);
           let balanceLBTBefore = await TestToken.balanceOf(LBT.address);
           let balanceOwnerBefore = await TestToken.balanceOf(accounts[0]);
           await LBT.reclaimToken(TestToken.address);
           let balanceLBTAfter = await TestToken.balanceOf(LBT.address);
           let balanceOwnerAfter = await TestToken.balanceOf(accounts[0]);
           assert.equal(balanceLBTBefore-balanceLBTAfter, 100, 'LBT balance is incorrect');
           assert.equal(balanceOwnerAfter-balanceOwnerBefore, 100, 'Owner balance is incorrect');


        });

        it('transferOwnership function test', async () => {
            let pendingOwner = accounts[1];
            await LBT.transferOwnership(pendingOwner);
            let _pendingOwner = await LBT.pendingOwner.call();

            assert.equal(pendingOwner, _pendingOwner, 'pendingOwner is incorrect');
        });

        it('claimOwnership function test', async () => {
            let newOwner = accounts[1];
            await LBT.claimOwnership({from: newOwner});
            let _newOwner = await LBT.owner.call();

            assert.equal(newOwner, _newOwner, 'owner is incorrect');
            await LBT.transferOwnership(accounts[0], {from: newOwner});
            await LBT.claimOwnership();
        });
    });
});

