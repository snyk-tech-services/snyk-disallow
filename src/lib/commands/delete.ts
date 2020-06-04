import { ProjectListForOrg } from '../snyk/types'
import SnykCommand  from '../snyk/command';

export default class Delete extends SnykCommand {
  static description = 'Delete disallow list'

  static examples = [
    `$ snyk-disallow delete myList`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [
                  { name: 'listName' }
                ]

  async run() {
    const {args, flags} = this.parse(Delete)
    
    this.log(`=========================================================`)
    this.log(`        Deleting disallow list ${args.listName}         `)
    this.log(`=========================================================`)

    try{
      let listProjectID = ''
      const responseAllListProjects = await this.requestManager.request({verb: "POST", url: `/org/${this.listOrgID}/projects`, body: '{}'})
      const allListProjects: ProjectListForOrg = responseAllListProjects.data
      allListProjects.projects.forEach(project => {
        if(project.name == args.listName){
          listProjectID = project.id
        }
      });
      if(listProjectID == ''){
        this.error('List not found', {exit: 2})
      }
      const result = await this.requestManager.request({verb: "DELETE", url: `/org/${this.listOrgID}/project/${listProjectID}`})
      this.log(`List deleted`)

    } catch (err) {
      this.error(err.message, {exit: 2})
    }
    
  }
}
