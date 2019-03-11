pragma solidity 0.5.4;


import "./SafeMath.sol";
import "./Manageable.sol";
//import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";
import "./oraclizeAPI_mock.sol";


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function mint(address to, uint256 value) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}



contract Sale is Ownable, usingOraclize {
    using SafeMath for uint;

    string public url = "json(https://api.etherscan.io/api?module=stats&action=ethprice&apikey=91DFNHV3CJDJE12PG4DD66FUZEK71TC6NW).result.ethusd";

    IERC20 public token;

    address payable public wallet;
    uint public rate;
    uint public usdRaised = 14107900;

    uint public startPrice = 1; // 0.001 $
    uint public step = 10000000; // 100k $

    uint public lastCallbackTimestamp;
    uint public minTimeUpdate = 600; // 10 min in sec

    uint public gasLimit = 150000;
    uint public timeout = 86400; // 1 day in sec

    event NewOraclizeQuery(string description);
    event NewPrice(uint price);
    event CallbackIsFailed(address lottery, bytes32 queryId);

    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint amount);

    constructor(uint _rate, address payable _wallet, address _token) public {
        require(_rate != 0);
        require(_token != address(0));
        require(_wallet != address(0));

        rate = _rate;
        token = IERC20(_token);
        wallet = _wallet;

    }

    function () external payable {
        buyTokens(msg.sender);
    }

    function sendEth() public payable {

    }

    function buyTokens(address _beneficiary) public payable {
        uint weiAmount = msg.value;
        require(_beneficiary != address(0));
        require(weiAmount != 0);

        // calculate token amount to be created
        uint tokensAmount = calcTokens(weiAmount);

        usdRaised = usdRaised.add(weiAmount.mul(rate).div(10**18));

        token.mint(_beneficiary, tokensAmount);

        wallet.transfer(msg.value);

        emit TokenPurchase(
            msg.sender,
            _beneficiary,
            weiAmount,
            tokensAmount
        );
    }

    function checkTokensAmount(uint _weiAmount, uint _price) public view returns (uint) {
        return _weiAmount.mul(rate).div(100).mul(1000).div(_price).div(10**18).mul(10**18);
    }

    function calcTokens(uint _weiAmount) public view returns (uint) {
        uint usdAmount = _weiAmount.mul(rate).div(10**18);
        uint usdToStep = step.sub(usdRaised % step);
        uint price = getPrice();

        if (usdAmount < usdToStep) {
            return checkTokensAmount(_weiAmount, price);
        } else {
            uint total = checkTokensAmount(usdToStep.mul(10**18).div(rate), price);

            uint stepsNum = (usdAmount.sub(usdToStep)).div(step);

            for(uint i = 0; i < stepsNum; i++) {
                total = total.add(checkTokensAmount(usdToStep.mul(10**18).div(rate), price.add(i + 1)));
            }

            uint usdAfterStep = (usdAmount.sub(usdToStep)) % step;

            uint tokensAfterStep = checkTokensAmount(usdAfterStep.mul(10**18).div(rate), price.add(1 + stepsNum));

            return total.add(tokensAfterStep);
        }
    }

    /**
     * @dev Reclaim all ERC20Basic compatible tokens
     * @param _token ERC20B The address of the token contract
     */
    function reclaimToken(IERC20 _token) external onlyOwner {
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(owner, balance);
    }

    function __callback(bytes32 _queryId, string memory  _result) public {
        require(msg.sender == oraclize_cbAddress());
        require(now > lastCallbackTimestamp + minTimeUpdate);
        rate = parseInt(_result, 2);
        emit NewPrice(rate);
        lastCallbackTimestamp = now;
        update();
        _queryId;
    }

    function setUrl(string memory _url) public onlyOwner {
        url = _url;
    }

    function update() public payable {
        require(msg.sender == oraclize_cbAddress() || msg.sender == address(owner));

        if (oraclize_getPrice("URL", gasLimit) > address(this).balance) {
            emit NewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            emit NewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(
            timeout,
            "URL",
            url,
            gasLimit
            );
        }
    }

    function getPrice() public view returns (uint) {
        if (usdRaised >= 10000000000) return 1000;
        return startPrice.add(usdRaised.div(step));
    }

    function withdrawETH(address payable _to, uint _amount) public onlyOwner {
        require(_to != address(0));

        address(_to).transfer(_amount);
    }

    function changeWallet(address payable _wallet) public onlyOwner {
        require(_wallet != address(0));
        wallet = _wallet;
    }

    function setTimeout(uint _timeout) public onlyOwner {
        timeout = _timeout;
    }

    function setGasLimit(uint _gasLimit) public onlyOwner {
        gasLimit = _gasLimit;
    }

}