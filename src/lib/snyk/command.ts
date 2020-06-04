import Command, {flags} from '@oclif/command'
import { requestsManager } from 'snyk-request-manager';
import { AccessibleOrgsList } from './types'
import { Input, OutputArgs, OutputFlags } from '@oclif/parser';

export default abstract class SnykCommand extends Command {
    

    requestManager = new requestsManager()

    supportedPackageManager = [
        'deb','gomodules','gradle','maven','pip','rpm','rubygems','cocoapods'
    ]
    
    listOrgName = ''
    listOrgID = ''

    static flags = {
        help: flags.help({ char: 'h' })
    };

    protected parsedFlags?: OutputFlags<typeof SnykCommand.flags>;

    async init() {

        const { flags } = this.parse(this.constructor as Input<typeof SnykCommand.flags>);

        this.parsedFlags = flags;
        const responseAccessibleOrgs = await this.requestManager.request({verb: "GET", url: '/orgs'})
        const accessibleOrgs: AccessibleOrgsList = responseAccessibleOrgs.data
        for(let i=0; i<accessibleOrgs.orgs.length; i++){
            if(accessibleOrgs.orgs[i].name.toLocaleLowerCase().includes('disallow')) {
                this.listOrgName = accessibleOrgs.orgs[i].name
                this.listOrgID = accessibleOrgs.orgs[i].id
                break
            }
        }
    }

    
}