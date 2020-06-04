import { ProjectListForOrg } from '../snyk/types'
import SnykCommand  from '../snyk/command';


export default class Create extends SnykCommand {
  static description = 'Create new disallow list'

  static examples = [
    `$ snyk-disallow create myList rubygems`,
  ]
  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [
                  { name: 'listName' },
                  { name: 'packageManager'}
                ]

  async run() {
    const {args, flags} = this.parse(Create)
    
    if(!this.supportedPackageManager.includes(args.packageManager)){
      this.log(`======= ERROR =======`)
      this.log(`${args.packageManager} is not a supported package manager.\nIt must be one of:`)
      this.supportedPackageManager.forEach(packageManager => this.log(`- ${packageManager}`))
      this.exit(1)
    }
    this.log(`=============================================================================================`)
    this.log(`    Creating disallow list ${args.listName} for ${args.packageManager} package manager      `)
    this.log(`=============================================================================================`)

    const emptyDepGraph = `{
      "depGraph": {
        "schemaVersion": "1.2.0",
        "pkgManager": {
        "name": "${args.packageManager}"
        },
        "pkgs": [
            {
                "id": "${args.listName}@1.0.0",
                "info": {
                "name": "${args.listName}",
                "version": "1.0.0"
                }
            }
        ],
        "graph": {
            "rootNodeId": "root-node",
            "nodes": [
                {
                "nodeId": "root-node",
                "pkgId": "${args.listName}@1.0.0",
                "deps": []
                }
            ]
        }
      }
    }`

    try{
      
      const responseAllListProjects = await this.requestManager.request({verb: "POST", url: `/org/${this.listOrgID}/projects`, body: '{}'})
      const alllistProjects: ProjectListForOrg = responseAllListProjects.data
      alllistProjects.projects.forEach(project => {
        if(project.name == args.listName){
          this.error(`List ${args.listName} already exists.`, {exit: 2})
        }
      });

      const response = await this.requestManager.request({verb: "POST", url: `/monitor/dep-graph?org=${this.listOrgID}`, body: emptyDepGraph})
      this.log(`List created at ${response.data.uri}`)

    } catch (err) {
        this.error(err.message, {exit: 2})
    }
    
  }
}
