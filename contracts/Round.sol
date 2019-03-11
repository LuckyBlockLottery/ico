pragma solidity 0.5.2;


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


contract Round {

    IERC20 public token;

    address public lottery;

    bytes32 public winHash = 0xb48d16f1ef8dfee98518ce287841bdda765d2ca7ed9160d49815e429b76f7866; // example

    constructor(address _lottery, address _token) public {
        require(_token != address(0));
        require(_lottery != address(0));

        token = IERC20(_token);
        lottery = _lottery;
    }

    function hash(uint256 a, uint256 b, uint256 c, uint256 d, uint256 e) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(a,b,c,d,e));
    }

    function checkHash(uint256 a, uint256 b, uint256 c, uint256 d, uint256 e) public view returns (bool) {
        if (hash(a,b,c,d,e) == winHash) {
            return true;
        } else {
            return false;
        }
    }

    function sendTokens(
        uint256 a,
        uint256 b,
        uint256 c,
        uint256 d,
        uint256 e,
        address _beneficiary,
        uint _amount
    )
        public
    {
        require(msg.sender == lottery);
        require(_beneficiary != address(0));
        require(_amount != 0);
        require(checkHash(a,b,c,d,e));

        token.mint(_beneficiary, _amount);
    }
    
    
    // *** For tests only! ***

    function setHash(uint a, uint b, uint c, uint d, uint e) public {
        winHash = hash(a, b, c, d, e);
    }
}

