def isAppSizeDataAvailableForCommit(commit) {
    env.CHECKING_COMMIT = commit
    echo "Check is app size data available for commit: ${CHECKING_COMMIT}"
    withAWS(role: "jenkins_app_metrics_admin", roleAccount: "910313616935", region: "us-west-2") {
        sh '''
            docker run -v $WORKSPACE:/mnt/ \
            -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
            -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
            -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
            $BUILD_SCRIPTS_DOCKER_IMAGE src/app_metrics_analytics.py \
            --platform Android \
            --operation is-data-available \
            --metric app-size \
            --github-access-token $GITHUB_ACCESS_TOKEN \
            --commit-id $CHECKING_COMMIT \
            --operation-output-file /mnt/app_metrics_data_$CHECKING_COMMIT.csv
        '''
    }
    def isDataAvailable = sh(
        script: "test -f app_metrics_data_${CHECKING_COMMIT}.csv && echo true || echo false",
        returnStdout: true
    ).toBoolean()
    if (isDataAvailable) {
        sh(script: "rm app_metrics_data_${CHECKING_COMMIT}.csv")
    }
    return isDataAvailable
}

void setBuildStatus(Map args) {
  // message: String
  // state: 'ERROR', 'FAILURE', 'PENDING', 'SUCCESS'
  step([
    $class: "GitHubCommitStatusSetter",
    // AND-12059 We don't strictly need to manually specify the commit
    // here because we don't import flex-libs, but it doesn't hurt
    // and if we import flexo-libs in the future, this will continue to work
    commitShaSource: [
      $class: "ManuallyEnteredShaSource",
      sha: env.GIT_COMMIT,
    ],
    contextSource: [
      $class: "ManuallyEnteredCommitContextSource",
      context: 'App size comparison',
    ],
    errorHandlers: [
      [
        $class: "ChangingBuildStatusErrorHandler",
        result: "FAILURE",
      ],
    ],
    reposSource: [
      $class: "ManuallyEnteredRepositorySource",
      url: "https://git.xarth.tv/twitch-apps/twitch-android",
    ],
    statusResultSource: [
      $class: "ConditionalStatusResultSource",
      results: [
        [
          $class: "AnyBuildResult",
          message: args['message'],
          state: args['state'],
        ],
      ],
    ],
  ]);
}

 def getBuildPr(buildNumber) {
     buildPrFile = "build_${buildNumber}_pr.xml"
     def buildPr = sh(
         script: "sudo curl -u devtools:$GITHUB_ACCESS_TOKEN -g $JOB_URL\"${buildNumber}\"/api/xml?xpath=//parameter[10]/value >> \"${buildPrFile}\";sed -e \"s/<[^>]*>//g\" \"${buildPrFile}\"",
         returnStdout: true
     ).trim()
     sh(script: "rm \"${buildPrFile}\"")
     return buildPr
 }

void abortStaleRunningBuilds() {
    def currentBuildNumber = env.BUILD_NUMBER.toInteger()
    def currentJob = Jenkins.instance.getItemByFullName(env.JOB_NAME)
    def buildsChecked = 0
    def maxBuildsNum = 10 // Same as the configuration in jenkins job
    for (def build : currentJob.builds) {
        def buildNumber = build.number
        if (build.result == null && buildNumber < currentBuildNumber) {
            if (getBuildPr(buildNumber) == env.ghprbPullId) {
                echo "Aborting stale running build #${buildNumber}"
                sh(script: "sudo curl -u devtools:$GITHUB_ACCESS_TOKEN -X POST $JOB_URL\"${buildNumber}\"/stop")
            }
        }
        // It seems that jenkins job will keep successful build even the total number
        //  of builds are > maxBuildsNum. When that happens the for loop will have issue
        // with iterator. So we do early break
        // if maxBuildsNum has reached.
        buildsChecked++
        if (buildsChecked >= maxBuildsNum) {
            break
        }
    }
}

def latestBuildId(jobName) {
    def job = Jenkins.instance.getItemByFullName(jobName)
    def buildId = 1
    for (def build : job.builds) {
        if (buildId < build.number) {
            buildId = build.number
        }
    }
    return buildId
}

pipeline {
  agent { label 'mobile-tools-prod' }
  environment {
    GITHUB_ACCESS_TOKEN = credentials('devtools-deployment-github-api-token')
    BUILD_SCRIPTS_DOCKER_IMAGE='docker.pkgs.xarth.tv/mobile-build-systems/mobile-build-scripts:v9.12.13'
    BUNDLE_FILE = "twitchapp/build/outputs/bundle/release/twitchapp-release.aab"
    TEST_BUNDLE_FILE = "twitchapp/build/outputs/bundle/release/test/twitchapp-release.aab"
    CONTROL_BUNDLE_FILE = "twitchapp/build/outputs/bundle/release/control/twitchapp-release.aab"
    TEST_APP_SIZE_DATA_SOURCE_FILE = "twitchapp/build/outputs/bundle/release/test/app_metrics_app_size_data.txt"
    CONTROL_APP_SIZE_DATA_SOURCE_FILE = "twitchapp/build/outputs/bundle/release/control/app_metrics_app_size_data.txt"
  }
  parameters {
    booleanParam(
      defaultValue: false,
      description: 'Check to force rebuild everything',
      name: 'RERUN_TASKS',
    )
  }
  stages {
    stage('Update submodules') {
      options {
        timeout(
          time: 20,
          unit: 'MINUTES'
        )
      }
      steps {
        sshagent (credentials: ['git-aws-read-key']) {
          sh '''
            git submodule sync --recursive
            git submodule update --init --recursive
          '''.trim()
        }
      }
    } // stage: update submodules
    stage('Create TEST data source file') {
      options {
        timeout(
          time: 5,
          unit: 'MINUTES',
        )
      }
      steps {
        setBuildStatus(
          message: 'Creating TEST app size data source file',
          state: 'PENDING',
        )
        sh '''
          ./jenkins/android-app-size-parse.bash \
            --aab-file $TEST_BUNDLE_FILE \
            --app-size-data-output-file $TEST_APP_SIZE_DATA_SOURCE_FILE
        '''.trim()
      }
      post {
        cleanup {
          archiveArtifacts artifacts: "$TEST_APP_SIZE_DATA_SOURCE_FILE"
        }
      }
    } // stage: Create TEST data source file
    stage('Store TEST app size data') {
      options {
        timeout(
          time: 5,
          unit: 'MINUTES',
        )
      }
      steps {
        setBuildStatus(
          message: 'Store TEST app size data',
          state: 'PENDING',
        )
        withAWS(role: "jenkins_app_metrics_admin", roleAccount: "910313616935", region: "us-west-2") {
          sh '''
            docker run -v "${WORKSPACE}":/mnt/ \
              -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
              -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
              -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
              --entrypoint=/bin/sh \
              "${BUILD_SCRIPTS_DOCKER_IMAGE}" -c \
            "
            python src/app_metrics_analytics.py \
            --platform Android \
            --operation store-data \
            --commit-id $ghprbActualCommit \
            --customer-artifact-dir /mnt/$TEST_APP_SIZE_DATA_SOURCE_FILE \
            --github-access-token $GITHUB_ACCESS_TOKEN
            "
          '''.trim()
        }
      }
    } // stage: Store TEST app size data
    stage('Create CONTROL data source file') {
      options {
        timeout(
          time: 5,
          unit: 'MINUTES',
        )
      }
      steps {
        setBuildStatus(
          message: 'Creating CONTROL app size data source file',
          state: 'PENDING',
        )
        script {
          if (env.IS_SKIP_CONTROL.toBoolean()) {
            echo "App size data available for $MASTER_HEAD, skip data source file creation!"
          } else {
            sh '''
              ./jenkins/android-app-size-parse.bash \
                --aab-file $CONTROL_BUNDLE_FILE \
                --app-size-data-output-file $CONTROL_APP_SIZE_DATA_SOURCE_FILE
            '''.trim()
            archiveArtifacts artifacts: "$CONTROL_APP_SIZE_DATA_SOURCE_FILE"
          }
        }
      }
    } // stage: Create CONTROL data source file
    stage('Store CONTROL app size data') {
      options {
        timeout(
          time: 5,
          unit: 'MINUTES',
        )
      }
      steps {
        setBuildStatus(
          message: 'Store CONTROL app size data',
          state: 'PENDING',
        )
        script {
          if (env.IS_SKIP_CONTROL.toBoolean()) {
            echo "App size data available for $MASTER_HEAD, skip store app size data!"
          } else {
            withAWS(role: "jenkins_app_metrics_admin", roleAccount: "910313616935", region: "us-west-2") {
              sh '''
                docker run -v "${WORKSPACE}":/mnt/ \
                  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
                  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
                  -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
                  --entrypoint=/bin/sh \
                  "${BUILD_SCRIPTS_DOCKER_IMAGE}" -c \
                "
                python src/app_metrics_analytics.py \
                --platform Android \
                --operation store-data \
                --commit-id $MASTER_HEAD \
                --customer-artifact-dir /mnt/$CONTROL_APP_SIZE_DATA_SOURCE_FILE \
                --github-access-token $GITHUB_ACCESS_TOKEN
                "
              '''.trim()
            }
          }
        }
      }
    } // stage: Store CONTROL app size data
    stage('App size comparison') {
      options {
        timeout(
          time: 5,
          unit: 'MINUTES',
        )
      }
      steps {
        setBuildStatus(
          message: 'Comparing app size with current master head',
          state: 'PENDING',
        )
        withAWS(role: "jenkins_app_metrics_admin", roleAccount: "910313616935", region: "us-west-2") {
          sh '''
            AA=aa sudo docker run -v "${WORKSPACE}":/mnt/ \
              -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
              -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
              -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
              --entrypoint=/bin/sh \
              "${BUILD_SCRIPTS_DOCKER_IMAGE}" -c \
            "
            python src/app_metrics_analytics.py \
            --platform Android \
            --operation compare \
            --metrics app-size \
            --commit-id $ghprbActualCommit \
            --control-commit-id $MASTER_HEAD \
            --github-access-token $GITHUB_ACCESS_TOKEN \
            --github-pull-request-id $ghprbPullId
            "
          '''.trim()
        }
      }
      post {
        success {
          setBuildStatus(
            message: 'Comparison finished',
            state: 'SUCCESS'
          )
        }
        failure {
          setBuildStatus(
            message: 'Comparison failed',
            state: "FAILURE",
          )
        }
      } // post
    } // stage: App size comparison
  } // stages
} // pipeline 2
