pragma solidity 0.5.2;


import "./Sale.sol";


contract Exchange is Sale {

    uint256 public exchangeLimit;
    IERC20 public stableCoin;
    mapping(address => uint256) public deposits;

    event DepositChanged(address indexed payee, uint256 indexed amount);
    event Withdrawn(address indexed payee, uint256 indexed amount);

    constructor(
        uint256 _rate,
        address payable _wallet,
        address _token,
        address _stableCoin,
        uint256 _exchangeLimit
    )
    public Sale(_rate, _wallet, _token)
    {
        require(_stableCoin != address(0));

        stableCoin = IERC20(_stableCoin);
        exchangeLimit = _exchangeLimit;
    }


    function setExchangeLimit(uint256 _value) public onlyOwner {
        exchangeLimit = _value;
    }

    function deposit(uint amount) public {
        deposits[msg.sender] = deposits[msg.sender].add(amount);
        token.transferFrom(msg.sender, address(this), amount);
        emit DepositChanged(msg.sender, deposits[msg.sender]);
    }

    function refundDeposit(uint amount) public {
        deposits[msg.sender] = deposits[msg.sender].sub(amount);
        token.transfer(msg.sender, amount);
        emit DepositChanged(msg.sender, deposits[msg.sender]);
    }

    function withdraw(address payee, uint amount) public onlyOwner {
        deposits[payee] = deposits[payee].sub(amount);

        stableCoin.transfer(payee, amount);

        emit Withdrawn(payee, amount);
    }

    function getDeposit(address payee) public view returns (uint256) {
        return deposits[payee];
    }

}