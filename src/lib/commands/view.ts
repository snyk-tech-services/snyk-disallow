import SnykCommand  from '../snyk/command';
import * as depGraph from '@snyk/dep-graph'
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'

export default class View extends SnykCommand {
  static description = 'View disallowed deps'

  static examples = [
    `$ snyk-disallow view`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [{name: 'listName'}]

  async run() {
    const {args, flags} = this.parse(View)
    this.log(`=========================================================`)
    this.log(`        Viewing disallow list ${args.listName}          `)
    this.log(`=========================================================`)

    try{
      let listID = ''
      const responseList = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/projects`})
      const list: ProjectListForOrg = responseList.data
      
      list.projects.forEach(project => {
        if(project.name == args.listName) {
          listID = project.id
        }
      })
      if(listID == ''){
        this.error(`Disallow list ${args.listName} Cannot be found`, {exit: 2})
      }
      const responseGraphFromApi = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/project/${args.listName}/dep-graph`})
      const graphFromApi: depGraphFromAPI = responseGraphFromApi.data
      const graph: depGraph.DepGraph = await depGraph.createFromJSON(JSON.parse(JSON.stringify(graphFromApi.depGraph)))
      
      graph.getPkgs().slice(1).forEach(pkg => {
        this.log(`${pkg.name}@${pkg.version}`)
      })
    } catch (err) {
      this.error(err.message, {exit: 2})
    }
    
  }
}
