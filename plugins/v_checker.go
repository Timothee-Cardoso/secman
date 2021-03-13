package checker

import (
	"time"
	"github.com/briandowns/spinner"
	"github.com/secman-team/shell"
	"runtime"
	"log"
	"fmt"
)

func Checker() {
	s := spinner.New(spinner.CharSets[11], 100*time.Millisecond)
	s.Suffix = " Checking for updates..."
	s.Start()

	err, out, errout := shell.ShellOut("")
	
	if runtime.GOOS == "windows" {
		err, out, errout = shell.PWSLOut("& ~/sm/vx.ps1 --sm")
	} else {
		err, out, errout = shell.ShellOut("verx --sm")
	}
		
	if err != nil {
		log.Printf("error: %v\n", err)
		fmt.Print(errout)
	}
		
	s.Stop()
	fmt.Print(out)
}
