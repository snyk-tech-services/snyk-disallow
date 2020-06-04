import SnykCommand  from '../snyk/command';
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'

export default class Add extends SnykCommand {
  static description = 'Remove new dep to disallow list'

  static examples = [
    `$ snyk-disallow rm dep version myList`,
  ]
  static flags = {
    ...SnykCommand.flags,
  }

  static args = [
                  { name: 'dep' },
                  { name: 'version' },
                  { name: 'listName' },
                ]

  async run() {
    const {args, flags} = this.parse(Add)
    
    this.log(`=============================================================================================`)
    this.log(`                  Remove dependency from list ${args.listName}                       `)
    this.log(`=============================================================================================`)


    try{
      
      let listID = ''
      const responseAllListProjects = await this.requestManager.request({verb: "POST", url: `/org/${this.listOrgID}/projects`, body: '{}'})
      const allListProjects: ProjectListForOrg = responseAllListProjects.data
      allListProjects.projects.forEach(project => {
        if(project.name == args.listName){
          listID = project.id
        }
      });

      if(listID == '') {
        this.error(`Error removing dep, ${args.listName} not found`, {exit: 2})
      }
      const responseExistingDepGraphFromApi = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/project/${listID}/dep-graph`})
      let existingDepGraphFromAPI: depGraphFromAPI = responseExistingDepGraphFromApi.data
      let pkgRToRemoveIndexInList = -1
      existingDepGraphFromAPI.depGraph.pkgs.forEach((pkg, index) => {
        if(pkg.id == `${args.dep}@${args.version}`){
          pkgRToRemoveIndexInList = index
          //this.error(`${args.dep}@${args.version} already exist in list ${args.listName}`, {exit: 2})
        }
      })
      if(pkgRToRemoveIndexInList == -1) {
        this.error(`${args.dep}@${args.version} was not found in ${args.listName}`, {exit: 2})
      }

      existingDepGraphFromAPI.depGraph.pkgs.splice(pkgRToRemoveIndexInList, 1)
      existingDepGraphFromAPI.depGraph.graph.nodes = existingDepGraphFromAPI.depGraph.graph.nodes.filter(node => node.nodeId != `${args.dep}@${args.version}`)
      
      existingDepGraphFromAPI.depGraph.graph.nodes[0].deps = existingDepGraphFromAPI.depGraph.graph.nodes[0].deps.filter(node => node.nodeId != `${args.dep}@${args.version}`)

      await this.requestManager.request({verb: "POST", url: `/monitor/dep-graph?org=${this.listOrgID}`, body: JSON.stringify(existingDepGraphFromAPI)})
      this.log(`${args.dep}@${args.version} removed from list ${args.listName}`)
      

    } catch (err) {
      this.error(err.message, {exit: 2})
    }
    
  }
}
