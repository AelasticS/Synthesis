import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('synth')
  .description('Synthesis model-driven engineering toolkit')
  .version('0.1.0')

program
  .command('validate <model>')
  .description('Validate a model file against its type constraints')
  .action((model: string) => {
    console.log(chalk.blue(`Validating ${model}...`))
    console.log(chalk.yellow('Not yet implemented'))
    process.exit(1)
  })

program
  .command('generate <model>')
  .description('Generate code from a model file')
  .requiredOption('-t, --template <path>', 'path to template directory')
  .option('-o, --out <path>', 'output directory', './src-gen')
  .action((model: string, opts: { template: string; out: string }) => {
    console.log(chalk.blue(`Generating from ${model} using ${opts.template} → ${opts.out}...`))
    console.log(chalk.yellow('Not yet implemented'))
    process.exit(1)
  })

program
  .command('transform <model>')
  .description('Apply a model-to-model transformation')
  .requiredOption('--tx <path>', 'path to transformation file')
  .requiredOption('-o, --out <path>', 'output model file path')
  .action((model: string, opts: { tx: string; out: string }) => {
    console.log(chalk.blue(`Transforming ${model} with ${opts.tx} → ${opts.out}...`))
    console.log(chalk.yellow('Not yet implemented'))
    process.exit(1)
  })

if (process.argv.length <= 2) {
  console.log(chalk.yellow('Interactive REPL coming soon. Run synth --help for available commands.'))
  process.exit(0)
}

program.parse(process.argv)
