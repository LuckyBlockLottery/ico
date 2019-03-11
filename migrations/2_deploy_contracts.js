const LBTContract = artifacts.require("./LuckyBucks.sol");
const SaleContract = artifacts.require("./Sale.sol");
const RoundContract = artifacts.require("./Round.sol");
const ExchangeContract = artifacts.require("./Exchange.sol");
const TTContract = artifacts.require("./TestToken.sol");


module.exports = async function(deployer, network, accounts) {

    let rate = 100;
    let wallet = "0x3C5459BCDE2D5c1eDc4Cc6C6547d6cb360Ce5aE9";

    if (network == 'develop'
        || network == 'ganache'
        || network == 'coverage')
    {
        deployer.then(async () => {

            await deployer.deploy(LBTContract);

            await deployer.link(LBTContract, SaleContract);
            await deployer.deploy(SaleContract, rate, wallet, LBTContract.address);

            await deployer.deploy(TTContract);

            await deployer.link(TTContract, SaleContract);
            await deployer.deploy(ExchangeContract, rate, wallet, LBTContract.address, TTContract.address, 1000);

            await deployer.deploy(RoundContract, accounts[0], LBTContract.address)

            return console.log('Contracts are deployed in test network!');
        });
    } else {
        deployer.then(async () => {

            await deployer.deploy(LBTContract);

            await deployer.link(LBTContract, SaleContract);
            await deployer.deploy(SaleContract, rate, wallet, LBTContract.address);

            await deployer.deploy(RoundContract, accounts[0], LBTContract.address)

            return console.log('Contracts are deployed in real network!');
        });
    }

};
