//Project list for org



interface ProjectListForOrg {
    org: Org;
    projects: Project[];
}

interface Project {
name: string;
id: string;
created: string;
origin: string;
type: string;
readOnly: string;
testFrequency: string;
totalDependencies: number;
issueCountsBySeverity: IssueCountsBySeverity;
remoteRepoUrl?: string;
lastTestedDate: string;
importingUser?: ImportingUser;
owner?: ImportingUser;
branch: string;
tags: Tag[];
imageId?: string;
imageTag?: string;
}

interface Tag {
key: string;
value: string;
}

interface ImportingUser {
id: string;
name: string;
username: string;
email: string;
}

interface IssueCountsBySeverity {
low: number;
high: number;
medium: number;
}

interface Org {
name: string;
id: string;
}

// Depgraph from API to depGraph type
interface depGraphFromAPI {
    depGraph: DepGraph;
  }
  
  interface DepGraph {
    schemaVersion: string;
    pkgManager: PkgManager;
    pkgs: Pkg[];
    graph: Graph;
  }
  
  interface Graph {
    rootNodeId: string;
    nodes: Node[];
  }
  
  interface Node {
    nodeId: string;
    pkgId: string;
    deps: Dep[];
  }
  
  interface Dep {
    nodeId: string;
  }
  
  interface Pkg {
    id: string;
    info: Info;
  }
  
  interface Info {
    name: string;
    version: string;
  }
  
  interface PkgManager {
    name: string;
  }


// Accessible Orgs list
interface AccessibleOrgsList {
    orgs: Org[];
}
  
interface Org {
    name: string;
    id: string;
    slug: string;
    url: string;
    group?: Group;
}
  
interface Group {
    name: string;
    id: string;
}

export {
    AccessibleOrgsList,
    ProjectListForOrg,
    depGraphFromAPI
}