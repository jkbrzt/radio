from fabric.api import cd, run, env, task


env.hosts = ['moo.cz']
ROOT = '/home/www/moo.cz/www'
PROJECT_DIR = ROOT + '/radio'


@task
def deploy():
    with cd(PROJECT_DIR):
        run('git pull')

@task
def bootstrap():
    with cd(ROOT):
        run('git clone git@github.com:jkbr/radio.git')
