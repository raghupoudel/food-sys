const crypto = require("crypto");

const Order = require("../models/Order");
const {
  generateEsewaSignature,
} = require("../utils/esewa");

/*
|--------------------------------------------------------------------------
| INITIATE ESEWA PAYMENT
|--------------------------------------------------------------------------
| POST /api/esewa/initiate
*/
const initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "ESEWA") {
      return res.status(400).json({
        success: false,
        message: "This order is not an eSewa order",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    /*
     * eSewa requires a unique transaction UUID.
     */
    const transactionUuid = `${order._id}-${Date.now()}`;

    const totalAmount = Number(
      order.totalAmount
    ).toFixed(2);

    const productCode =
      process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";

    const signature = generateEsewaSignature(
      totalAmount,
      transactionUuid,
      productCode
    );

    /*
     * eSewa UAT payment URL
     */
    const paymentUrl =
  process.env.ESEWA_PAYMENT_URL;

    /*
     * Store transaction UUID on the order.
     *
     * We will use this later when verifying
     * the payment.
     */
    order.esewaTransactionUuid =
      transactionUuid;

    await order.save();

    const paymentData = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url:
        `${process.env.CLIENT_URL}/payment/esewa/success`,
      failure_url:
        `${process.env.CLIENT_URL}/payment/esewa/failure`,
      signed_field_names:
        "total_amount,transaction_uuid,product_code",
      signature,
    };

    return res.status(200).json({
      success: true,
      message: "eSewa payment initiated",
      data: {
        paymentUrl,
        paymentData,
      },
    });
  } catch (error) {
    console.error(
      "eSewa initiate payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to initiate eSewa payment",
    });
  }
};

module.exports = {
  initiateEsewaPayment,
};
