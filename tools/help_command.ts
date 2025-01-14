import * as Config from "@oclif/config";
const chalk = require("chalk");
import indent from "indent-string";
import stripAnsi from "strip-ansi";
import { renderList } from "./list";
import { castArray, compact, sortBy, template } from "./bool";
import wrap from "wrap-ansi";

const { underline, bold } = chalk;
let { dim } = chalk;

if (process.env.ConEmuANSI === "ON") {
  dim = chalk.grey;
}

export interface HelpOptions {
  all?: boolean;
  maxWidth: number;
  stripAnsi?: boolean;
}

export class CommandHelp {
  render: (input: string) => string;

  constructor(
    public command: Config.Command,
    public config: Config.IConfig,
    public opts: HelpOptions
  ) {
    this.render = template(this);
  }

  generate(): string {
    const cmd = this.command;
    const flags = sortBy(
      Object.entries(cmd.flags || {})
        .filter(([, v]) => !v.hidden)
        .map(([k, v]) => {
          v.name = k;
          return v;
        }),
      (f) => [!f.char, f.char, f.name]
    );
    const args = (cmd.args || []).filter((a) => !a.hidden);
    let output = compact([
      this.usage(flags),
      this.args(args),
      this.flags(flags),
      this.description(),
      this.aliases(cmd.aliases),
      this.examples(cmd.examples || (cmd as any).example),
    ]).join("\n\n");
    if (this.opts.stripAnsi) output = stripAnsi(output);
    return output;
  }

  protected usage(flags: Config.Command.Flag[]): string {
    const usage = this.command.usage;
    const body = (usage ? castArray(usage) : [this.defaultUsage(flags)])
      .map((u) => `$ ${this.config.bin} ${u}`.trim())
      .join("\n");
    return [
      bold.grey("USAGE\n"),
      indent(
        wrap(this.render(chalk.cyan(body)), this.opts.maxWidth - 2, {
          trim: false,
          hard: true,
        }),
        2
      ),
    ].join("\n");
  }

  protected defaultUsage(_: Config.Command.Flag[]): string {
    return compact([
      this.command.id,
      this.command.args
        .filter((a) => !a.hidden)
        .map((a) => this.arg(a))
        .join(" "),
    ]).join(" ");
  }

  protected description(): string | undefined {
    const cmd = this.command;
    const description =
      cmd.description &&
      this.render(cmd.description).split("\n").slice(1).join("\n");
    if (!description) return;
    return [
      bold.grey("DESCRIPTION\n"),
      indent(
        wrap(description.trim(), this.opts.maxWidth - 2, {
          trim: false,
          hard: true,
        }),
        2
      ),
    ].join("\n");
  }

  protected aliases(aliases: string[] | undefined): string | undefined {
    if (!aliases || aliases.length === 0) return;
    const body = aliases
      .map((a) => ["$", this.config.bin, a].join(" "))
      .join("\n");
    return [
      bold.grey("ALIASES\n"),
      indent(
        wrap(chalk.cyan(body), this.opts.maxWidth - 2, {
          trim: false,
          hard: true,
        }),
        2
      ),
    ].join("\n");
  }

  protected examples(
    examples: string[] | undefined | string
  ): string | undefined {
    if (!examples || examples.length === 0) return;
    const body = castArray(examples)
      .map((a) => this.render(a))
      .join("\n");

    const view = chalk.grey("- ") + body;

    return [
      bold.grey("EXAMPLE" + (examples.length > 1 ? "S" : "") + "\n"),
      indent(
        wrap(view, this.opts.maxWidth - 2, {
          trim: false,
          hard: true,
        }),
        2
      ),
    ].join("\n");
  }

  protected args(args: Config.Command["args"]): string | undefined {
    if (args.filter((a) => a.description).length === 0) return;
    const body = renderList(
      args.map((a) => {
        const name = a.name.toUpperCase();
        let description = a.description || "";

        // `a.default` is actually not always a string (typing bug), hence `toString()`
        if (a.default || a.default?.toString() === "0")
          description = `[default: ${a.default}] ${description}`;
        if (a.options) description = `(${a.options.join("|")}) ${description}`;

        return [name, description ? dim(description) : undefined];
      }),
      { stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2 }
    );

    return [bold.grey("ARGUMENTS\n"), indent(body, 2)].join("\n");
  }

  protected arg(arg: Config.Command["args"][0]): string {
    const name = arg.name.toUpperCase();
    if (arg.required) return `${name}`;
    return `[${name}]`;
  }

  protected flags(flags: Config.Command.Flag[]): string | undefined {
    if (flags.length === 0) return;

    const body = renderList(
      flags.map((flag) => {
        let left = flag.helpLabel;

        if (!left) {
          const label = [];
          if (flag.char) label.push(`-${flag.char[0]}`);

          if (flag.name) {
            if (flag.type === "boolean" && flag.allowNo) {
              label.push(`--[no-]${flag.name.trim()}`);
            } else {
              label.push(`--${flag.name.trim()}`);
            }
          }

          left = label.join(", ");
        }

        if (flag.type === "option") {
          let value = flag.helpValue || flag.name;
          if (!flag.helpValue && flag.options) {
            value = flag.options.join("|");
          }

          if (!value.includes("|")) value = underline(value);
          left += `=${value}`;
        }

        let right = flag.description || "";
        // `flag.default` is not always a string (typing bug), hence `toString()`
        if (
          flag.type === "option" &&
          (flag.default || flag.default?.toString() === "0")
        ) {
          right = `[default: ${flag.default}] ${right}`;
        }

        if (flag.required) right = `(required) ${right}`;

        return [left, dim(right.trim())];
      }),
      { stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2 }
    );

    return [bold.grey("FLAGS\n"), indent(body, 2)].join("\n");
  }
}
