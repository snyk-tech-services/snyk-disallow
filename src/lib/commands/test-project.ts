import SnykCommand  from '../snyk/command';
import * as depGraph from '@snyk/dep-graph'
import { ProjectListForOrg, depGraphFromAPI } from '../snyk/types'
import cli from 'cli-ux'
import readPipe from '../utils/read-stdin-stream'//' ,,//read-stdin-stream'
import * as depgraph from '@snyk/dep-graph'

export default class TestProject extends SnykCommand {
  static description = 'Test project against disallowed deps'

  static examples = [
    `$ snyk-disallow test-project`,
  ]

  static flags = {
    ...SnykCommand.flags,
  }
  
  static args = [ {name: 'listName'}]

  async run() {
    const {args, flags} = this.parse(TestProject)
    try {
      const pipedData = await readPipe()

      if (!pipedData) {
        this.error('Did not detect a snyk test output - expecting snyk test --print-deps --json', {exit: 2})
      }
      const inputData: Array<any> = JSON.parse("["+pipedData.replace(/}\n{/g,"},\n{").replace("}\n[","},\n[")+"]")
      
      // TODO: Handle --all-projects setups, bail for now
      if(inputData.length > 2){
        console.log("Sorry, I can't handle --all-projects commands right now, but soon !")
        process.exitCode = 2
      }
      
      const snykTestJsonDependencies = inputData.length > 1 ? inputData[0] : null
      const snykTestJsonResults = inputData.length > 1 ? inputData[1]: inputData[0]

      cli.action.start('Processing snyk test output')
      
      let projectDepGraph: depGraph.DepGraph
      if(snykTestJsonDependencies && snykTestJsonDependencies.depGraph){ // Getting graph
        projectDepGraph = depgraph.createFromJSON(snykTestJsonDependencies.depGraph)
      } else { // Getting legacy dep tree
        projectDepGraph = await depgraph.legacy.depTreeToGraph( snykTestJsonDependencies as depgraph.legacy.DepTree,
                                                                snykTestJsonResults.packageManager)
      }
      const packageManager = projectDepGraph.pkgManager.name

      this.log(`=========================================================================================`)
      this.log(`     Testing project against disallow list(s)     `)
      this.log(`=========================================================================================`)

      // Retrieve all applicable lists for that packageManager
      cli.action.start('Retrieving list(s)')
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
        this.error('Failed disallow check', { exit: 1})
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
