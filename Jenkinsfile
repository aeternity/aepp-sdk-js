pipeline {
  agent {
    dockerfile {
      filename 'Dockerfile.ci'
      args '-v /etc/group:/etc/group:ro -v /etc/passwd:/etc/passwd:ro -v /var/lib/jenkins:/var/lib/jenkins --network host'
    }
  }

  stages {
    stage('Generate wallets') {
      steps {
        sh 'bin/keys genkey wallet-0 -o /tmp'
        sh 'bin/keys genkey wallet-1 -o /tmp'
        sh 'bin/keys genkey wallet-2 -o /tmp'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh '''#!/bin/bash
          export WALLET_PRIV_0=$(</tmp/wallet-0)
          export WALLET_PRIV_1=$(</tmp/wallet-1)
          export WALLET_PRIV_2=$(</tmp/wallet-2)
          export WALLET_PUB_0=$(</tmp/wallet-0.pub)
          export WALLET_PUB_1=$(</tmp/wallet-1.pub)
          export WALLET_PUB_2=$(</tmp/wallet-2.pub)
          npm run test-jenkins
        '''
      }
    }
  }

  post {
    always {
      junit 'test-results.xml'
    }
  }
}
