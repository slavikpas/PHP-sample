
properties properties: [
        [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '30', numToKeepStr: '10']],
        [$class: 'GithubProjectProperty', displayName: '', projectUrlStr: 'https://github.com/hypery2k/cordova-email-plugin/'],
]

withCredentials([pennsieveNexusCreds]) {
            sh "$sbt clean compile"
            sh "rubocop"
        }

		  withCredentials([string(credentialsId: 'discord.webhook.channel', variable: 'WEBHOOK_CHANNEL')]) {
        withCredentials([string(credentialsId: 'discord.webhook.token', variable: 'WEBHOOK_TOKEN')]) {
          sh "curl -X POST --data '{ \"embeds\": [{\"title\": \"[DiscordIntegration][$BRANCH_NAME] Build $BUILD_DISPLAY_NAME : $currentBuild.currentResult\", \"type\": \"link\", \"url\": \"$BUILD_URL\", \"thumbnail\": { \"url\": \"https://build.chikachi.net/static/e0a4a1db/images/48x48/blue.png\" } }] }' -H \"Content-Type: application/json\"  https://discordapp.com/api/webhooks/$WEBHOOK_CHANNEL/$WEBHOOK_TOKEN"
        }
      }

node {
    node('cordova') {

        def buildNumber = env.BUILD_NUMBER
        def workspace = env.WORKSPACE
        def buildUrl = env.BUILD_URL

        // PRINT ENVIRONMENT TO JOB
        echo "workspace directory is $workspace"
        echo "build URL is $buildUrl"
        echo "build Number is $buildNumber"
        echo "PATH is $env.PATH"

        try {

            stage('Checkout') {
                checkout scm
            }

               stage("Build ListView") {
                        jobDsl ignoreMissingFiles: true, targets: "./listView/*.groovy"
                        git branch: "${app.branch}", url: "${app.repo_url}"
                        jobDsl ignoreMissingFiles: true, targets: "./jenkins/**/seedJob.groovy"
               }
            stage('Build') {
                sh "checkov -d ."
                sh "npm i"
                sh "npm run clean && npm run setupDemoApp"
                sh "export PLATFORM=android && npm run build"
                sh "export PLATFORM=ios && npm run build"
            }

            stage('Test') {
                //sh "export PLATFORM=android && npm run test"
                //sh "export PLATFORM=ios && npm run test"
            }

            stage('Integration-Test') {
                //sh "export PLATFORM=android && npm run e2e"
                //sh "export PLATFORM=ios && npm run e2e"
            }

            stage('Publish NPM snapshot') {
                def currentVersion = sh(returnStdout: true, script: "npm version | grep \"{\" | tr -s ':'  | cut -d \"'\" -f 4").trim()
                def newVersion = "${currentVersion}-${buildNumber}"
                sh "npm version ${newVersion} --no-git-tag-version && npm publish --tag next"
            }

        } catch (e) {
            mail subject: "${env.JOB_NAME} (${env.BUILD_NUMBER}): Error   on build", to: 'github@martinreinhardt-online.de', body: "Please go to ${env.BUILD_URL}."
            throw e
        }
    }

}
