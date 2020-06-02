import SnykCommand  from '../snyk/command';
import * as depGraph from '@snyk/dep-graph'
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'
import cli from 'cli-ux'

export default class CheckProject extends SnykCommand {
  static description = 'Check project against disallowed deps'

  static examples = [
    `$ snyk-disallow check-project orgID projectID [list name]`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [ {name: 'orgID'},
                  {name: 'projectID'},
                  {name: 'listName'}]

  async run() {
    const {args, flags} = this.parse(CheckProject)
    this.log(`=========================================================================================`)
    this.log(`     Checking ${args.projectID} against disallow list(s)     `)
    this.log(`=========================================================================================`)

    try{
      cli.action.start('Retrieving project dep graph')
      // Check if project exists and retrieve graph
      let projectID = ''
      const allProjectslist: ProjectListForOrg = await this.requestManager.request({verb: "GET", url: `/org/${args.orgID}/projects`})
      allProjectslist.projects.forEach(project => {
        if(project.id == args.projectID) {
          projectID = project.id
        }
      })
      if(projectID == ''){
        this.error(`Project ${args.projectID} Cannot be found in ${args.orgID}`, {exit: 2})
      }

      const projectDepGraphFromApi: depGraphFromAPI  = await this.requestManager.request({verb: "GET", url: `/org/${args.orgID}/project/${projectID}/dep-graph`})
      const projectDepGraph: depGraph.DepGraph = await depGraph.createFromJSON(JSON.parse(JSON.stringify(projectDepGraphFromApi.depGraph)))

      const packageManager = projectDepGraph.pkgManager.name

      // Retrieve all applicable lists for that packageManager
      cli.action.start('Retrieving disallow list(s)')
      let listsArray: { listID: string,
                         listName: string}[] = []
      const list: ProjectListForOrg = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/projects`})
      if(typeof args.listName != 'undefined'){
        list.projects.forEach(project => {
          if(project.name == args.listName && project.type == packageManager) {
            listsArray.push({'listID':project.id, 'listName':project.name})
          }
        })
        if(listsArray.length == 0){
          this.error(`List ${args.listName} cannot be found or is incompatible package manager`, {exit: 2})
        }
      } else {
        this.log('Checking in all disallow lists')
        listsArray = list.projects.filter(project => project.type == packageManager).map(project => {return {'listID': project.id, 'listName': project.name}})
        if(listsArray.length == 0){
          this.error(`No applicable disallow list can be found for this package manager ${packageManager}`, {exit: 2})
        }
      }
     
      let listPkgs: {
                            packageID: string;
                            listName: string;
                          }[] = []

      
      for(let i=0; i< listsArray.length; i++) {
        let list = listsArray[i]
        const graphFromApi: depGraphFromAPI  = await this.requestManager.request({verb: "GET", url: `/org/${this.listOrgID}/project/${list.listID}/dep-graph`})
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
      cli.action.stop('done !\n')
      if(infringingPkgs.length > 0) {
        this.log(`Found ${infringingPkgs.length} infringing package(s):`)
        infringingPkgs.forEach(infrigingPkg => this.log(`=> ${infrigingPkg}`))
        this.error('Failed disallow list check', { exit: 1})
      } else {
        this.log(`No disallowed package found !`)
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
