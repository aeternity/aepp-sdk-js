pipeline {
  agent {
    dockerfile {
      filename 'Dockerfile.ci'
      args '-v /etc/group:/etc/group:ro -v /etc/passwd:/etc/passwd:ro -v /var/lib/jenkins:/var/lib/jenkins'
    }
  }

  environment {
    TEST_URL = credentials('TEST_URL')
    TEST_NODE = credentials('TEST_NODE')
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
          sh 'yarn test-jenkins'
        }
      }
    }
  }

  post {
    always {
      junit 'test-results.xml'
      archive 'dist/aepp-sdk.js'
    }
  }
}
