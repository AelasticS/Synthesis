import { Flags } from '@oclif/core'

import { BaseCommand } from './base-command.js'
import { formatStubJson, formatStubText } from '../support/stub-output.js'
import type { StubReport } from '../types/stub.js'

/**
 * Base class for stub commands that print "would do" messages.
 * Extends BaseCommand and adds the printStub() helper.
 */
export abstract class StubCommand extends BaseCommand {
  /**
   * Print the stub report in the appropriate format based on flags.
   *
   * @param report - The stub report containing command info and next steps
   */
  protected async printStub(report: Omit<StubReport, 'stub'>): Promise<void> {
    const { flags } = await this.parse(this.constructor as typeof StubCommand)

    const fullReport: StubReport = {
      stub: true,
      ...report
    }

    if (flags.json) {
      this.log(formatStubJson(fullReport))
    } else {
      this.log(
        formatStubText(fullReport, {
          quiet: flags.quiet,
          verbose: flags.verbose
        })
      )
    }
  }
}
