import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import { readConfigFile } from "../../app/config";
import { PRIMARY_COLOR } from "../../constants";

export default class WhoamI extends Command {
  static description = "Display the current user.";

  static flags = {
    help: flags.help({ char: "h" }),
    username: flags.boolean({
      char: "u",
      description: "just show the username",
    }),
  };

  async run() {
    const { flags } = this.parse(WhoamI);

    const username = readConfigFile("name");
    const email = readConfigFile("user");

    if (username) {
      switch (flags.username) {
        case true:
          this.log(username);

          break;

        default:
          console.log(
            `👊 Hi ${chalk.hex(PRIMARY_COLOR).bold(username)} <${chalk.bold(
              email
            )}>`
          );
      }
    }
  }
}
