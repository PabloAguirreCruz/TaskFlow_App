const isSignedIn = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/sign-in');
};

const isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/tasks');
};

module.exports = { isSignedIn, isGuest };