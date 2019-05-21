pipeline {
  agent {
    dockerfile {
      filename 'Dockerfile.ci'
      args '-v /etc/group:/etc/group:ro ' +
           '-v /etc/passwd:/etc/passwd:ro ' +
           '-v /var/lib/jenkins:/var/lib/jenkins ' +
           '-v /usr/bin/docker:/usr/bin/docker:ro ' +
           '--network=host'
    }
  }

  stages {
    stage('Build') {
      steps {
        sh 'ln -sf /node_modules ./'
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'genesis-wallet',
                                          usernameVariable: 'WALLET_PUB',
                                          passwordVariable: 'WALLET_PRIV')]) {
          sh 'docker-compose -H localhost:2376 pull node'
          sh 'docker-compose -H localhost:2376 build'
          sh 'docker-compose -H localhost:2376 run sdk npm run test-jenkins'
        }
      }
    }
  }

  post {
    always {
      junit 'test-results.xml'
      archive 'dist/*'
      sh 'docker-compose -H localhost:2376 down -v --rmi local ||:'
    }
  }
}
