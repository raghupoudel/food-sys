const crypto = require("crypto");

const generateEsewaSignature = (
  totalAmount,
  transactionUuid,
  productCode
) => {
  const message =
    `total_amount=${totalAmount},` +
    `transaction_uuid=${transactionUuid},` +
    `product_code=${productCode}`;

  return crypto
    .createHmac(
      "sha256",
      process.env.ESEWA_SECRET_KEY
    )
    .update(message)
    .digest("base64");
};

module.exports = {
  generateEsewaSignature,
};
