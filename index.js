const cron = require("node-cron");
const Web3 = require("web3");
require("dotenv").config();

const CRONJOB_INTERVAL = "*/5 * * * * *";

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const waitForTxConfirmation = async (txHash, web3) => {
  let receipt = null;
  try {
    while (!receipt) {
      receipt = await web3.eth.getTransactionReceipt(txHash);
      if (receipt && receipt.status === true) {
        return true;
      }
      await sleep(1000);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const task = cron.schedule(
  CRONJOB_INTERVAL,
  async () => {
    try {
      console.log("Cronjob is running for every 5s");

      const SHIMMER_EVM_TESTNET_RPC = process.env.SHIMMER_EVM_TESTNET_RPC;
      const provider = new Web3.providers.HttpProvider(SHIMMER_EVM_TESTNET_RPC);
      const web3 = new Web3(provider);
      const privateKey = process.env.PRIVATE_KEY;
      const recipient = process.env.RECIPIENT;
      const amountInWei = process.env.AMOUNT_IN_WEI;
      const from = web3.eth.accounts.privateKeyToAccount(privateKey).address;

      const transaction = {
        from,
        to: recipient,
        value: amountInWei,
        gas: 30000,
      };

      const signed = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      );

      const receipt = await web3.eth.sendSignedTransaction(
        signed.rawTransaction
      );

      await waitForTxConfirmation(receipt.transactionHash, web3);
    } catch (err) {
      console.log(err);
    }
  },
  false
);
task.start();
