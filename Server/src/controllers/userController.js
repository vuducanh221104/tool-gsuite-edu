const userService = require('../services/userService');

async function create(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    handleError(err, res, next);
  }
}

async function update(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.userKey, req.body);
    res.json({ user });
  } catch (err) {
    handleError(err, res, next);
  }
}

async function remove(req, res, next) {
  try {
    await userService.deleteUser(req.params.userKey);
    res.status(200).json({ message: `User ${req.params.userKey} deleted successfully` });
  } catch (err) {
    handleError(err, res, next);
  }
}

function handleError(err, res, next) {
  if (err && err.errors && Array.isArray(err.errors)) {
    return res.status(err.code || 500).json({ error: err.errors.map(e => e.message).join('; ') });
  }
  if (err && err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  return next(err);
}

module.exports = { create, update, remove };

async function list(req, res, next) {
  try {
    const { pageToken, maxResults, orderBy, sortOrder, domain } = req.query;
    const result = await userService.listUsers({ pageToken, maxResults: maxResults ? Number(maxResults) : undefined, orderBy, sortOrder, domain });
    res.json(result);
  } catch (err) {
    handleError(err, res, next);
  }
}

async function listAll(req, res, next) {
  try {
    const { domain, chunkSize, orderBy, sortOrder } = req.query;
    const users = await userService.listAllUsers({ domain, chunkSize: chunkSize ? Number(chunkSize) : undefined, orderBy, sortOrder });
    res.json({ users, count: users.length });
  } catch (err) {
    handleError(err, res, next);
  }
}

module.exports.list = list;
module.exports.listAll = listAll;


