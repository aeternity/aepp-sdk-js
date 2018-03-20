pipeline {
  agent {
    docker {
      image 'node:9.8.0'
      args '-v /etc/group:/etc/group:ro -v /etc/passwd:/etc/passwd:ro -v /var/lib/jenkins:/var/lib/jenkins'
    }
  }

  stages {
    stage('Dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm run test-jenkins'
      }
    }
  }

  post {
    always {
      junit 'test-results.xml'
    }
  }
}
