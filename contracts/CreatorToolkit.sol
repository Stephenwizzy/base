// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract Owned {
    address public owner;

    error NotOwner();
    error ZeroAddress();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract ProfileRegistry {
    uint256 public constant MAX_URI_LENGTH = 512;
    mapping(address => string) public profileURI;

    error URITooLong();
    event ProfileUpdated(address indexed account, string uri);

    function setProfile(string calldata uri) external {
        if (bytes(uri).length > MAX_URI_LENGTH) revert URITooLong();
        profileURI[msg.sender] = uri;
        emit ProfileUpdated(msg.sender, uri);
    }
}

contract MessageBoard {
    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    struct Message {
        address author;
        uint64 timestamp;
        string text;
    }

    Message[] private messages;

    error EmptyMessage();
    error MessageTooLong();
    event MessagePosted(uint256 indexed id, address indexed author, string text);

    function post(string calldata text) external {
        uint256 length = bytes(text).length;
        if (length == 0) revert EmptyMessage();
        if (length > MAX_MESSAGE_LENGTH) revert MessageTooLong();
        messages.push(Message(msg.sender, uint64(block.timestamp), text));
        emit MessagePosted(messages.length - 1, msg.sender, text);
    }

    function messageCount() external view returns (uint256) {
        return messages.length;
    }

    function getMessage(uint256 id) external view returns (Message memory) {
        return messages[id];
    }
}

contract Guestbook {
    uint256 public constant MAX_NOTE_LENGTH = 160;

    struct Entry {
        uint64 timestamp;
        string note;
    }

    mapping(address => Entry) public entries;
    address[] private guests;

    error AlreadySigned();
    error NoteTooLong();
    event Signed(address indexed guest, string note);

    function sign(string calldata note) external {
        if (entries[msg.sender].timestamp != 0) revert AlreadySigned();
        if (bytes(note).length > MAX_NOTE_LENGTH) revert NoteTooLong();
        entries[msg.sender] = Entry(uint64(block.timestamp), note);
        guests.push(msg.sender);
        emit Signed(msg.sender, note);
    }

    function guestCount() external view returns (uint256) {
        return guests.length;
    }

    function guestAt(uint256 index) external view returns (address) {
        return guests[index];
    }
}

contract ProofRegistry {
    struct Proof {
        address submitter;
        uint64 timestamp;
    }

    mapping(bytes32 => Proof) public proofs;

    error EmptyHash();
    error AlreadyRegistered();
    event ProofRegistered(bytes32 indexed documentHash, address indexed submitter);

    function register(bytes32 documentHash) external {
        if (documentHash == bytes32(0)) revert EmptyHash();
        if (proofs[documentHash].timestamp != 0) revert AlreadyRegistered();
        proofs[documentHash] = Proof(msg.sender, uint64(block.timestamp));
        emit ProofRegistered(documentHash, msg.sender);
    }
}

contract LinkRegistry {
    uint256 public constant MAX_KEY_LENGTH = 32;
    uint256 public constant MAX_URL_LENGTH = 256;

    mapping(address => mapping(string => string)) private links;

    error InvalidKey();
    error URLTooLong();
    event LinkUpdated(address indexed account, string indexed key, string url);

    function setLink(string calldata key, string calldata url) external {
        uint256 keyLength = bytes(key).length;
        if (keyLength == 0 || keyLength > MAX_KEY_LENGTH) revert InvalidKey();
        if (bytes(url).length > MAX_URL_LENGTH) revert URLTooLong();
        links[msg.sender][key] = url;
        emit LinkUpdated(msg.sender, key, url);
    }

    function getLink(address account, string calldata key) external view returns (string memory) {
        return links[account][key];
    }
}

contract TipJar is Owned {
    bool private withdrawing;

    error NoFunds();
    error TransferFailed();
    error ReentrantCall();

    event TipReceived(address indexed sender, uint256 amount, string message);
    event Withdrawn(address indexed recipient, uint256 amount);

    constructor(address initialOwner) Owned(initialOwner) {}

    receive() external payable {
        emit TipReceived(msg.sender, msg.value, "");
    }

    function tip(string calldata message) external payable {
        if (msg.value == 0) revert NoFunds();
        emit TipReceived(msg.sender, msg.value, message);
    }

    function withdraw(address payable recipient) external onlyOwner {
        if (withdrawing) revert ReentrantCall();
        if (recipient == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();

        withdrawing = true;
        (bool success, ) = recipient.call{value: amount}("");
        withdrawing = false;
        if (!success) revert TransferFailed();
        emit Withdrawn(recipient, amount);
    }
}

contract SimplePoll {
    string public question;
    string[] private options;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public voteCount;

    error InvalidOptions();
    error InvalidOption();
    error AlreadyVoted();
    event VoteCast(address indexed voter, uint256 indexed option);

    constructor(string memory pollQuestion, string[] memory pollOptions) {
        if (bytes(pollQuestion).length == 0 || pollOptions.length < 2 || pollOptions.length > 10) {
            revert InvalidOptions();
        }
        question = pollQuestion;
        options = pollOptions;
    }

    function vote(uint256 option) external {
        if (option >= options.length) revert InvalidOption();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        hasVoted[msg.sender] = true;
        voteCount[option]++;
        emit VoteCast(msg.sender, option);
    }

    function getOptions() external view returns (string[] memory) {
        return options;
    }
}

contract AchievementBadges is Owned {
    mapping(address => mapping(bytes32 => bool)) public hasBadge;
    mapping(bytes32 => string) public badgeMetadataURI;

    error BadgeExists();
    error BadgeMissing();
    event BadgeDefined(bytes32 indexed badgeId, string metadataURI);
    event BadgeAwarded(address indexed recipient, bytes32 indexed badgeId);

    constructor(address initialOwner) Owned(initialOwner) {}

    function defineBadge(bytes32 badgeId, string calldata metadataURI) external onlyOwner {
        if (bytes(badgeMetadataURI[badgeId]).length != 0) revert BadgeExists();
        badgeMetadataURI[badgeId] = metadataURI;
        emit BadgeDefined(badgeId, metadataURI);
    }

    function award(address recipient, bytes32 badgeId) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        if (bytes(badgeMetadataURI[badgeId]).length == 0) revert BadgeMissing();
        if (hasBadge[recipient][badgeId]) revert BadgeExists();
        hasBadge[recipient][badgeId] = true;
        emit BadgeAwarded(recipient, badgeId);
    }
}

contract AllowlistRegistry is Owned {
    mapping(address => bool) public allowed;

    event AllowlistUpdated(address indexed account, bool allowed);

    constructor(address initialOwner) Owned(initialOwner) {}

    function setAllowed(address account, bool isAllowed) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        allowed[account] = isAllowed;
        emit AllowlistUpdated(account, isAllowed);
    }

    function setAllowedBatch(address[] calldata accounts, bool isAllowed) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            allowed[accounts[i]] = isAllowed;
            emit AllowlistUpdated(accounts[i], isAllowed);
        }
    }
}

contract DeploymentDirectory is Owned {
    mapping(bytes32 => address) public deployments;
    bytes32[] private names;

    error AlreadyRegistered();
    event DeploymentRegistered(bytes32 indexed name, address indexed deployment);

    constructor(address initialOwner) Owned(initialOwner) {}

    function register(bytes32 name, address deployment) external onlyOwner {
        if (name == bytes32(0) || deployment == address(0)) revert ZeroAddress();
        if (deployments[name] != address(0)) revert AlreadyRegistered();
        deployments[name] = deployment;
        names.push(name);
        emit DeploymentRegistered(name, deployment);
    }

    function count() external view returns (uint256) {
        return names.length;
    }

    function nameAt(uint256 index) external view returns (bytes32) {
        return names[index];
    }
}
