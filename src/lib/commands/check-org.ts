import SnykCommand  from '../snyk/command';
import * as depGraph from '@snyk/dep-graph'
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'
import cli from 'cli-ux'
import * as chalk from 'chalk'

export default class CheckOrg extends SnykCommand {
  static description = 'Check all projects of given org against all disallow deps or specified disallow list only'

  static examples = [
    `$ snyk-disallow check-org orgID [disallow list name (optional)]`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [ {name: 'orgID'},
                  {name: 'listName'}]

  async run() {
    const {args, flags} = this.parse(CheckOrg)
    this.log(`=========================================================================================`)
    this.log(`     Checking ${args.orgID} against applicable disallow list(s)         `)
    this.log(`=========================================================================================`)

    try{
      cli.action.start('Retrieving all projects for org')
      
      let isAnyProjectInfringing = false
      const responseProjectList = await this.requestManager.request({verb: "GET", url: `/org/${args.orgID}/projects`})
      const allProjectslist: ProjectListForOrg = responseProjectList.data
      
      for(let i=0; i < allProjectslist.projects.length; i++) {
        
        let projectID = allProjectslist.projects[i].id
        let projectName = allProjectslist.projects[i].name
        cli.action.start(`Retrieving dep graph for project ${projectName} (${projectID})`)

        const responseProjectDepGraphFromApi = await this.requestManager.request({verb: "GET", url: `/org/${args.orgID}/project/${projectID}/dep-graph`})
        const projectDepGraphFromApi: depGraphFromAPI = responseProjectDepGraphFromApi.data 
        const projectDepGraph: depGraph.DepGraph = await depGraph.createFromJSON(JSON.parse(JSON.stringify(projectDepGraphFromApi.depGraph)))

        const packageManager = projectDepGraph.pkgManager.name

        // Retrieve all applicable listIDs for that packageManager
        cli.action.start('Retrieving disallow list(s)')
        let listsArray: { listID: string,
                          listName: string}[] = []
        const projectListResponse = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/projects`})
        const list: ProjectListForOrg = projectListResponse.data
        
        if(typeof args.listName != 'undefined'){
          list.projects.forEach(project => {
            if(project.name == args.listName && project.type == packageManager) {
              listsArray.push({'listID':project.id, 'listName':project.name})
            }
          })
          if(listsArray.length == 0){
            this.log(`List ${args.listName} cannot be found or is incompatible package manager`)
          }
        } else {
          cli.action.start('Checking in all disallow lists')
          listsArray = list.projects.filter(project => project.type == packageManager).map(project => {return {'listID': project.id, 'listName': project.name}})
          // if(listsArray.length == 0){
          //   this.error(`No applicable list can be found for this package manager ${packageManager}`, {exit: 2})
          // }
        }
      
        let listPkgs: {
                              packageID: string;
                              listName: string;
                            }[] = []

        
        for(let i=0; i< listsArray.length; i++) {
          let list = listsArray[i]
          const responseGraphFromApi = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/project/${list.listID}/dep-graph`})
          const graphFromApi: depGraphFromAPI = responseGraphFromApi.data
          const graph: depGraph.DepGraph = await depGraph.createFromJSON(JSON.parse(JSON.stringify(graphFromApi.depGraph)))
          listPkgs = listPkgs.concat(graph.getPkgs().slice(1).map(pkg => {return {'packageID': `${pkg.name}@${pkg.version}`, 'listName': `${list.listName}`}}))
        }    
        
        const infringingPkgs: Array<string> = []
        projectDepGraph.getPkgs().splice(1).forEach(pkg => {
          const index = listPkgs.map(listPkg => listPkg.packageID).indexOf(`${pkg.name}@${pkg.version}`)
          
          if(index > -1) {
            infringingPkgs.push(`${pkg.name}@${pkg.version} in list ${listPkgs[index].listName}`)
          }
        })
        cli.action.start(`\n${projectName} (${projectID})`)
        cli.action.stop()
        if(infringingPkgs.length > 0) {
          this.log(chalk.redBright(`Found ${infringingPkgs.length} infringing package(s):`))
          infringingPkgs.forEach(infrigingPkg => this.log(chalk.redBright(`=> ${infrigingPkg}`)))
          isAnyProjectInfringing = true
        } else {
          this.log(chalk.greenBright(`No disallowed package found for project ${projectName} (${projectID})!`))
        }
        
      }
      if(isAnyProjectInfringing) {
        this.error('Failed disallow check', { exit: 1})
      }
      

      

    } catch (err) {
        if(err.oclif) {
          this.error(err, {exit: err.oclif.exit})
        } else {
          this.error(err.message, {exit: 2})
        }
    }
    
  }
}
