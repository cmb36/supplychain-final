// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SupplyChain {
    enum Role { None, Producer, Factory, Retailer, Consumer }
    enum UserStatus { None, Pending, Approved, Rejected,Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    struct User {
        uint256 id;
        address wallet;
        Role role;
        UserStatus status;
    }

    struct Token {
        uint256 id;
        string name;
        string features;
        uint256 parentId;
        mapping(address => uint256) balance;
    }

    struct Transfer {
        uint256 id;
        uint256 tokenId;
        address from;
        address to;
        uint256 amount;
        TransferStatus status;
        uint256 timestamp;
    }

    address public admin;
    uint256 private _userCount;
    uint256 private _tokenCount;
    uint256 private _transferCount;

    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToUserId;
    mapping(uint256 => Token) private tokens;
    mapping(uint256 => Transfer) public transfers;

    event UserRequested(uint256 indexed userId, address indexed wallet, Role requestedRole);
    event UserApproved(uint256 indexed userId, Role role);
    event UserRejected(uint256 indexed userId);

    event TokenCreated(uint256 indexed tokenId, string name, uint256 parentId, address indexed owner, uint256 amount);
    event TransferCreated(uint256 indexed transferId, uint256 indexed tokenId, address indexed from, address to, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event TokenConsumed(uint256 indexed tokenId, address indexed consumer, uint256 amount);// New event for future use
    event UserCanceled(uint256 indexed userId, address indexed wallet);// New event for future use


    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyApproved() {
        uint256 uid = addressToUserId[msg.sender];
        require(uid != 0 && users[uid].status == UserStatus.Approved, "User not approved");
        _;
    }

    function _nextRoleFor(Role r) internal pure returns (Role) { // helper recomended for future use
        if (r == Role.Producer) return Role.Factory;
        if (r == Role.Factory)  return Role.Retailer;
        if (r == Role.Retailer) return Role.Consumer;
        return Role.None;
    }

    constructor() { admin = msg.sender; }

    function requestUserRole(Role requested) external {
        require(requested != Role.None, "Invalid role");
        uint256 current = addressToUserId[msg.sender];
        if (current == 0) {
            _userCount++;
            users[_userCount] = User({ id: _userCount, wallet: msg.sender, role: Role.None, status: UserStatus.Pending });
            addressToUserId[msg.sender] = _userCount;
            emit UserRequested(_userCount, msg.sender, requested);
        } else {
            require(users[current].status != UserStatus.Approved, "Already approved");
            users[current].status = UserStatus.Pending;
            emit UserRequested(current, msg.sender, requested);
        }
    }

    function approveUser(uint256 userId, Role role) external onlyAdmin {
        require(userId != 0 && userId <= _userCount, "Invalid user");
        require(role != Role.None, "Invalid role");
        users[userId].status = UserStatus.Approved;
        users[userId].role = role;
        emit UserApproved(userId, role);
    }

    function rejectUser(uint256 userId) external onlyAdmin {
        require(userId != 0 && userId <= _userCount, "Invalid user");
        users[userId].status = UserStatus.Rejected;
        emit UserRejected(userId);
    }

    function cancelMyUser() external {//Soft delete user account
        uint256 uid = addressToUserId[msg.sender];
        require(uid != 0, "No user");
        users[uid].status = UserStatus.Canceled;
        users[uid].role = Role.None; // opcional, deja el rol en blanco
        emit UserCanceled(uid, msg.sender);
    }

    function deactivateUser(uint256 userId) external onlyAdmin { //Admin can cancel user account
        require(userId != 0 && userId <= _userCount, "Invalid user");
        users[userId].status = UserStatus.Canceled;
        users[userId].role = Role.None;
        emit UserCanceled(userId, users[userId].wallet);
    }


    function _requireRole(address who, Role r) internal view {
        uint256 uid = addressToUserId[who];
        require(uid != 0, "User missing");
        User memory u = users[uid];
        require(u.status == UserStatus.Approved && u.role == r, "Role/Status mismatch");
    }

    function createToken(string calldata name, string calldata features, uint256 parentId, uint256 amount)
        external onlyApproved returns (uint256 tokenId)
    {
        require(bytes(name).length > 0, "Name required");
        require(amount > 0, "Amount > 0");

        uint256 uid = addressToUserId[msg.sender];
        Role role = users[uid].role;
        if (parentId == 0) {
            require(role == Role.Producer, "Only Producer for raw");
        } else {
            require(role == Role.Factory, "Only Factory for derived");
        }

        _tokenCount++;
        tokenId = _tokenCount;

        Token storage t = tokens[tokenId];
        t.id = tokenId;
        t.name = name;
        t.features = features;
        t.parentId = parentId;
        t.balance[msg.sender] = amount;

        emit TokenCreated(tokenId, name, parentId, msg.sender, amount);
    }

    function createTransfer(uint256 tokenId, address to, uint256 amount) external onlyApproved returns (uint256 transferId) {
        require(to != address(0), "to != 0");
        require(amount > 0, "amount > 0");
        require(tokens[tokenId].id != 0, "Token missing");
        require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");

        uint256 uidFrom = addressToUserId[msg.sender]; // Enforce linear pipeline: Producer->Factory->Retailer->Consumer
        Role fromRole = users[uidFrom].role;

        uint256 uidTo = addressToUserId[to];
        require(uidTo != 0, "Receiver must be a registered user");
        require(users[uidTo].status == UserStatus.Approved, "Receiver not approved");
        require(fromRole != Role.Consumer, "Consumer cannot send");
        require(users[uidTo].role == _nextRoleFor(fromRole), "Invalid next role");


        _transferCount++;
        transferId = _transferCount;

        transfers[transferId] = Transfer({
            id: transferId, tokenId: tokenId, from: msg.sender, to: to,
            amount: amount, status: TransferStatus.Pending, timestamp: block.timestamp
        });

        emit TransferCreated(transferId, tokenId, msg.sender, to, amount);
    }

        function transfer(address to, uint256 tokenId, uint256 amount)
        external
        onlyApproved
        returns (uint256 transferId)
    {
        require(to != address(0), "to != 0");
        require(amount > 0, "amount > 0");
        require(tokens[tokenId].id != 0, "Token missing");
        require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");

        uint256 uidFrom = addressToUserId[msg.sender];
        Role fromRole = users[uidFrom].role;

        uint256 uidTo = addressToUserId[to];
        require(uidTo != 0, "Receiver must be a registered user");
        require(users[uidTo].status == UserStatus.Approved, "Receiver not approved");
        require(fromRole != Role.Consumer, "Consumer cannot send");
        require(users[uidTo].role == _nextRoleFor(fromRole), "Invalid next role");

        _transferCount++;
        transferId = _transferCount;

        transfers[transferId] = Transfer({
            id: transferId,
            tokenId: tokenId,
            from: msg.sender,
            to: to,
            amount: amount,
            status: TransferStatus.Pending,
            timestamp: block.timestamp
        });

        emit TransferCreated(transferId, tokenId, msg.sender, to, amount);
    }


    function acceptTransfer(uint256 transferId) external onlyApproved {
        Transfer storage tr = transfers[transferId];
        require(tr.id != 0, "Transfer missing");
        require(tr.status == TransferStatus.Pending, "Not pending");
        require(tr.to == msg.sender, "Not receiver");

        Token storage t = tokens[tr.tokenId];
        require(t.balance[tr.from] >= tr.amount, "From balance changed");
        unchecked { t.balance[tr.from] -= tr.amount; t.balance[msg.sender] += tr.amount; }

        tr.status = TransferStatus.Accepted;
        emit TransferAccepted(transferId);
    }

    function rejectTransfer(uint256 transferId) external onlyApproved {
        Transfer storage tr = transfers[transferId];
        require(tr.id != 0, "Transfer missing");
        require(tr.status == TransferStatus.Pending, "Not pending");
        require(tr.to == msg.sender, "Not receiver");
        tr.status = TransferStatus.Rejected;
        emit TransferRejected(transferId);
    }
    function consume(uint256 tokenId, uint256 amount) external onlyApproved { //New function for future use
        _requireRole(msg.sender, Role.Consumer);
        require(tokens[tokenId].id != 0, "Token missing");
        require(amount > 0, "amount > 0");
        require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");

        unchecked {
            tokens[tokenId].balance[msg.sender] -= amount;
        }

        emit TokenConsumed(tokenId, msg.sender, amount);
    }


    function getUserByAddress(address who) external view returns (User memory) {
        uint256 uid = addressToUserId[who];
        require(uid != 0, "No user");
        return users[uid];
    }

    function getTokenInfo(uint256 tokenId) external view returns (uint256 id, string memory name, string memory features, uint256 parentId) {
        Token storage t = tokens[tokenId];
        require(t.id != 0, "Token missing");
        return (t.id, t.name, t.features, t.parentId);
    }

    function getTokenBalance(uint256 tokenId, address owner) external view returns (uint256) {
        require(tokens[tokenId].id != 0, "Token missing");
        return tokens[tokenId].balance[owner];
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        uint256 uid = addressToUserId[user];
        require(uid != 0, "No user");

        uint256[] memory temp = new uint256[](_tokenCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= _tokenCount; i++) {
            if (tokens[i].balance[user] > 0) {
                temp[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = temp[j];
        }

        return result;
    }

    function getUserTransfers(address user) external view returns (uint256[] memory) {
        uint256 uid = addressToUserId[user];
        require(uid != 0, "No user");

        uint256[] memory temp = new uint256[](_transferCount);
        uint256 count = 0;

        for (uint256 i = 1; i <= _transferCount; i++) {
            Transfer storage tr = transfers[i];
            if (tr.id != 0 && (tr.from == user || tr.to == user)) {
                temp[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = temp[j];
        }

        return result;
    }

    function traceLineage(uint256 tokenId) external view returns (uint256[] memory) {
        require(tokens[tokenId].id != 0, "Token missing");
        uint256 count = 0; uint256 cur = tokenId;
        while (cur != 0) { count++; cur = tokens[cur].parentId; }
        uint256[] memory path = new uint256[](count);
        cur = tokenId;
        for (uint256 i = 0; i < count; i++) { path[i] = cur; cur = tokens[cur].parentId; }
        return path;
    }
}
