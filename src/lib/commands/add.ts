import SnykCommand  from '../snyk/command';
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'

export default class Add extends SnykCommand {
  static description = 'Add new dep to disallow list'

  static examples = [
    `$ snyk-disallow add dep version mylist`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }

  static args = [
                  { name: 'dep' },
                  { name: 'version' },
                  { name: 'disallowListName' },
                ]

  async run() {
    const {args, flags} = this.parse(Add)
    
    this.log(`=============================================================================================`)
    this.log(`                     Add dependency to disallow list ${args.disallowListName}                       `)
    this.log(`=============================================================================================`)

    const emptyPkg = `{
      "id": "${args.dep}@${args.version}",
      "info": {
        "name": "${args.dep}",
        "version": "${args.version}"
      }
    }`


    try{
      
      let listID = ''
      const responseProjects = await this.requestManager.request({verb: "POST", url: `/org/${this.listOrgID}/projects`, body: '{}'})
      const allListProjects: ProjectListForOrg = responseProjects.data
      allListProjects.projects.forEach(project => {
        if(project.name == args.disallowListName){
          listID = project.id
        }
      });

      if(listID == '') {
        this.error(`Error adding dep, ${args.disallowListName} not found`, {exit: 2})
      }
      const responseDepgraph = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/project/${listID}/dep-graph`})
      let existingDepGraphFromAPI: depGraphFromAPI = responseDepgraph.data
      
      existingDepGraphFromAPI.depGraph.pkgs.forEach(pkg => {
        if(pkg.id == `${args.dep}@${args.version}`){
          this.error(`${args.dep}@${args.version} already exist in list ${args.disallowListName}`, {exit: 2})
        }
      })

      existingDepGraphFromAPI.depGraph.pkgs.push(JSON.parse(emptyPkg))
      existingDepGraphFromAPI.depGraph.graph.nodes[0].deps.push({nodeId: `${args.dep}@${args.version}`})
      existingDepGraphFromAPI.depGraph.graph.nodes.push({
                                                          nodeId: `${args.dep}@${args.version}`,
                                                          pkgId: `${args.dep}@${args.version}`,
                                                          deps: []
                                                        })
      

      await this.requestManager.request({verb: "POST", url: `/monitor/dep-graph?org=${this.listOrgID}`, body: JSON.stringify(existingDepGraphFromAPI)})
      this.log(`${args.dep}@${args.version} added to list ${args.disallowListName}`)
      

    } catch (err) {
      this.error(err.message, {exit: 2})
    }
    
  }
}
