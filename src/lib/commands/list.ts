import { ProjectListForOrg } from '../snyk/types'
import SnykCommand from '../snyk/command';

export default class List extends SnykCommand {
  static description = 'List all disallow lists'

  static examples = [
    `$ snyk-disallow list`,
  ]
  static flags = {
    ...SnykCommand.flags,
  }
  

  async run() {
    this.log(`=========================================================`)
    this.log(`        Listing disallow lists in ${this.listOrgName}   `)
    this.log(`=========================================================`)
    try{
      const projectList: ProjectListForOrg = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/projects`})
      this.log(`Found ${projectList.projects.length} list(s)`)
      projectList.projects.forEach(list => {
        this.log(`=> ${list.name}`)
      })
    } catch (err) {
      this.error(err.message, {exit: 2})
    }
    
  }
}
