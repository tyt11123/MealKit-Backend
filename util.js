const jwt = require('jsonwebtoken');
const config = require('./config');
const getToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      isCourier: user.isCourier,
    },
    config.JWT_SECRET,
    {
      expiresIn: '48h',
    }
  );
};

const getResetToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      isCourier: user.isCourier,
      isReset: true,
    },
    config.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );
};

const isAuth = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    const onlyToken = token.slice(7, token.length);
    jwt.verify(onlyToken, config.JWT_SECRET, (err, decode) => {
      if (err) {
        return res.status(401).send({ message: 'Invalid Token' });
      }
      req.user = decode;
      next();
      return;
    });
  } else {
    return res.status(401).send({ message: 'Token is not supplied.' });
  }
};

const isAdmin = (req, res, next) => {
  console.log(req.user);
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(401).send({ message: 'Admin Token is not valid.' });
};

const isReset = (req, res, next) => {
  console.log(req.user);
  if (req.user && req.user.isReset) {
    return next();
  }
  return res.status(401).send({ message: 'Reset Token is not valid.' });
};

const isCourier = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.isCourier)) {
    return next();
  }
  return res.status(401).send({ message: 'Staff Token is not valid.' });
};

const getAuth = (req) => {
  try {
    const token = req.headers.authorization;

    if (token) {
      const onlyToken = token.slice(7, token.length);
      const decode = jwt.verify(onlyToken, config.JWT_SECRET);
      return decode;
    } else {
      return null;
    }
  } catch(err) {
    return null;
  };
};

module.exports = { getToken, getResetToken, isAuth, isAdmin, isReset, isCourier, getAuth, };
