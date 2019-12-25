# SugarCube v1

**NOTICE:**  SugarCube v1 has been superseded by [SugarCube v2](https://github.com/tmedwards/sugarcube-2) and is no longer actively developed.  It will receive maintenance releases only—e.g., critical bug fixes.  You should probably look into [SugarCube v2](https://github.com/tmedwards/sugarcube-2) instead.

----

[SugarCube](http://www.motoslave.net/sugarcube/) is a free (gratis and libre) story format for [Twine/Twee](http://twinery.org/).

Downloads and documentation may be found at [SugarCube website](http://www.motoslave.net/sugarcube/).

If you believe that you've found a bug in SugarCube or simply wish to make a suggestion, you may do so by [creating a new issue](https://github.com/tmedwards/sugarcube-1/issues).

## INSTALLATION

You may either download one of the precompiled packages from [SugarCube's website](http://www.motoslave.net/sugarcube/) or build SugarCube from source—see **BUILDING FROM SOURCE** below.

## BUILDING FROM SOURCE

If you want to build SugarCube from scratch, rather than grabbing one of the pre-built packages off of its website, then these instructions are for you.

SugarCube uses Node.js as the core of its build system, so you'll need to install it if you don't already have it.  Additionally, to retrieve SugarCube's source code from this repository, you'll need to install Git.

1. [Download and install the Node.js JavaScript runtime (`https://nodejs.org/`)](https://nodejs.org/)
2. [Download and install the Git source control management tool (`https://git-scm.com/`)](https://git-scm.com/)

Once all the tooling has been installed and set up, the next step is to fetch the SugarCube source code.  Open a shell to wherever you wish to store the code and run the following command to clone the repository:

```
git clone https://github.com/tmedwards/sugarcube-1.git
```

Next, change to the directory that the previous command created, which is your local clone of the repository:

```
cd sugarcube-1
```

There are two major branches within the repository:

* `master`: The stable release branch
* `develop`: The main development branch

Be sure to switch to the branch you wish to work on by issuing the appropriate `git checkout` command.

Once you're on the correct branch, fetch SugarCube's development dependencies:

```
npm install
```

You should now have SugarCube and all dependencies downloaded, so you may build it by running the following command:

```
node build.js
```

Assuming that completed with no errors, the story format, in Twine 1 and Twine 2 flavors, should be output to the `dist` directory.  Congratulations!

**TIP:**  If you'd like additional options when building—e.g., debug builds, limiting the build to a particular version of Twine, etc.—you may request help from `build.js` by specifying the help (`-h`, `--help`) option.  For example:

```
node build.js -h
```
