#!/usr/bin/env node

import { run } from '@oclif/command'

const runOclif = async () => 
{
    try {
        await run()
        require('@oclif/command/flush')()
    } catch (err) {
        require('@oclif/errors/handle')(err)
    }
    
}


runOclif()

