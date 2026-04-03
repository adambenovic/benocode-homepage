// Jest mock for isomorphic-dompurify (ESM-only package)
module.exports = {
  default: { sanitize: (input) => input },
  sanitize: (input) => input,
};
