using System;
using System.IO;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexTypes;

class Program
{
    static async Task Main(string[] args)
    {

        var rpc = "http://blockchain:8545";
        var privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        var abiPath = "contracts/SensorToken.abi";
        var binPath = "contracts/SensorToken.bin";
        var outFile = "./contract_address.txt";

        if (string.IsNullOrWhiteSpace(privateKey))
        {
            Console.WriteLine("Error: --privatekey is required (use one of Anvil accounts)");
            return;
        }


        var abi = File.ReadAllText(abiPath);
        var bin = File.ReadAllText(binPath);


        var account = new Account(privateKey, chainId: 31337);
        var web3 = new Web3(account, rpc);


        Console.WriteLine($"Using account: {account.Address}");
        Console.WriteLine("Deploying contract...");


        var receipt = await web3.Eth.DeployContract.SendRequestAndWaitForReceiptAsync(abi, bin, account.Address, new HexBigInteger(6000000));


        Console.WriteLine($"Deployed at: {receipt.ContractAddress}");


        File.WriteAllText(outFile, receipt.ContractAddress);


        Console.WriteLine($"Wrote address to: {outFile}");

    }
}