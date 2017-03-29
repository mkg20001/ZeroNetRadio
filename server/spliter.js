const fs=require("fs")
const what=process.argv[2]
const path=require("path")
const loc=path.join(__dirname,"..")
const partLoc=path.join(loc,"parts")
const mkdirp=require("mkdirp")
const cp=require("child_process")


//Split up input stream into parts by 1min, set the date to play - is cur+60*mins
if (!fs.existsSync(what)) throw new Error("Invalid file: "+what)

const tmpLoc=path.join(loc,"tmp")

cp.execSync("rm -rf "+partLoc+" "+tmpLoc)

mkdirp.sync(partLoc)
mkdirp.sync(tmpLoc)

const tmpFile=path.join(tmpLoc,"file.mp3")

cp.execSync("cp -v "+what+" "+tmpFile)

const timet={
  "s":1,
  "m":60,
  "h":60*60
}

function ptime(s) {
  const a=s.split("_")
  return a.map(t => {
    if (t=="99h") return 0
    const t_=t.split("")
    const v=timet[t_.pop()]
    return parseInt(t_.join(""),10)*v*1000
  }).reduce((a,b) => a+b,0)
}

cp.spawn("mp3splt",[tmpFile,"-t","0.10","-d",tmpLoc],{stdio:"inherit"}).on("exit",(code,sig) => {
  if (code||sig) {
    throw new Error("mp3splt error "+(code||sig))
  }
  const parts=fs.readdirSync(tmpLoc).filter(f => f.indexOf("file_")!=-1).map(f => {
    const ft=f.split("_").slice(1).join("_").split(".mp3")[0].split("__")
    return {
      start:ptime(ft[0]),
      end:ptime(ft[1]),
      path:path.join(tmpLoc,f)
    }
  })
  console.log(parts)
  const offset=new Date().getTime()
  const pre=parts.map(f => {
    f._start=f.start
    f._end=f.end
    f._path=f.path
    f.start+=offset
    f.end+=offset
    f.name=f.start+".mp3"
    f.path=path.join(partLoc,f.name)
    fs.renameSync(f._path,f.path)
    return f
  })
  console.log(pre)
  const manifest=parts.map(f => {
    return {loc:f.name,start:f.start,end:f.end}
  })
  console.log(manifest)
  fs.writeFileSync(path.join(partLoc,"manifest.json"),JSON.stringify(manifest))
})
