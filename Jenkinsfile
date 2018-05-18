pipeline {
  agent {
    dockerfile {
      filename 'Dockerfile.ci'
      args '-v /etc/group:/etc/group:ro ' +
           '-v /etc/passwd:/etc/passwd:ro ' +
           '-v /var/lib/jenkins:/var/lib/jenkins ' +
           '-v /usr/bin/docker-compose:/usr/bin/docker-compose:ro ' +
           '-v /usr/bin/docker:/usr/bin/docker:ro ' +
           '-v /var/run/docker.sock:/var/run/docker.sock ' +
           '--group-add docker'
    }
  }

  stages {
    stage('Build') {
      steps {
        sh 'yarn build'
      }
    }

    stage('Test') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'genesis-wallet',
                                          usernameVariable: 'WALLET_PUB',
                                          passwordVariable: 'WALLET_PRIV')]) {
          sh 'docker-compose build'
          sh 'docker-compose run sdk yarn test-jenkins'
        }
      }
    }
  }

  post {
    always {
      junit 'test-results.xml'
      archive 'dist/*'
      sh 'docker-compose down -v ||:'
    }
  }
}
