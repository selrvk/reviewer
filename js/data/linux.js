(function () {
  const C = String.raw;
  window.TOPICS = window.TOPICS || [];

  window.TOPICS.push({
    id: "linux",
    title: "Unix / Linux",
    dir: "unix-linux/",
    accent: "linux",
    blurb: "Commands, permissions, processes, grep/sed/awk, pipes and shell scripting. Expect a lot of this for support and operations roles, where you'll dig through logs on Unix servers.",

    notes: [
      {
        title: "Basics & the filesystem",
        blocks: [
          { p: "**Unix** is the original OS from AT&T Bell Labs (1969); commercial versions include AIX, Solaris and HP-UX. **Linux** is a free, Unix-*like* kernel by Linus Torvalds (1991), packaged into distributions such as RHEL, Ubuntu and CentOS. Commands are almost identical across both." },
          { ul: [
            "**Kernel**: the core of the OS. It manages CPU, memory, devices and processes.",
            "**Shell**: the command interpreter between you and the kernel: `bash`, `sh`, `ksh` (common on enterprise Unix), `zsh`.",
            "**Everything is a file**: devices, sockets and processes (`/proc`) are all exposed as files.",
            "**Absolute path** starts at `/` (`/opt/app/logs`). **Relative path** starts from the current directory (`./logs`, `../conf`).",
            "`~` = home directory · `.` = current directory · `..` = parent · files starting with `.` are hidden."
          ]},
          { table: {
            head: ["Directory", "Contains"],
            rows: [
              ["`/`", "Root of the whole tree"],
              ["`/bin`, `/usr/bin`", "User commands (`ls`, `cp`, `grep`)"],
              ["`/sbin`", "System admin commands (`reboot`, `ifconfig`)"],
              ["`/etc`", "Configuration files (`/etc/passwd`, `/etc/hosts`)"],
              ["`/home`", "Users' home directories (root's is `/root`)"],
              ["`/var`", "Variable data, especially **logs** (`/var/log`)"],
              ["`/tmp`", "Temporary files, often cleared on reboot"],
              ["`/opt`", "Optional / third-party applications"],
              ["`/proc`", "Virtual files with process and kernel info"],
              ["`/dev`", "Device files (`/dev/null`, `/dev/sda`)"]
            ]
          }}
        ]
      },
      {
        title: "Files & directories",
        blocks: [
          { code: C`
            pwd                       # print working directory
            ls -l                     # long listing: permissions, owner, size, date
            ls -la                    # include hidden files
            ls -ltr                   # sort by time, newest LAST (handy for logs)
            ls -lhS                   # human-readable sizes, largest first
            cd /opt/app  |  cd ..  |  cd ~  |  cd -     # cd - = previous dir

            mkdir -p a/b/c            # create nested dirs
            touch file.txt            # create empty file / update timestamp
            cp file.txt backup.txt    # copy
            cp -r src/ dest/          # copy directory recursively
            mv old.txt new.txt        # move or rename
            rm file.txt               # delete file
            rm -rf dir/               # delete dir recursively, no prompts (careful!)
            rmdir emptydir            # delete EMPTY directory

            cat file.txt              # print whole file
            less big.log              # page through (q quit, /text search, G end)
            head -n 20 file.txt       # first 20 lines
            tail -n 50 app.log        # last 50 lines
            tail -f app.log           # follow file as it grows (Ctrl+C to stop)
            wc -l file.txt            # count lines (-w words, -c bytes)
            diff a.txt b.txt          # show differences
            file mystery.bin          # detect file type
          `, lang: "bash" },
          { h: "Hard links vs soft (symbolic) links" },
          { code: C`
            ln target.txt hard.txt        # hard link
            ln -s /opt/app/v2 current     # soft/symbolic link
          `, lang: "bash" },
          { table: {
            head: ["", "Hard link", "Soft (symbolic) link"],
            rows: [
              ["Points to", "Same **inode** (same data)", "A **path name**"],
              ["If original is deleted", "Still works (data stays until all links are gone)", "**Broken** (dangling link)"],
              ["Across filesystems", "No", "Yes"],
              ["For directories", "No", "Yes"],
              ["`ls -l` shows", "Regular file, link count > 1", "`l` type, `name -> target`"]
            ]
          }},
          { p: "**Inode**: a data structure that stores a file's metadata: permissions, owner, size, timestamps and pointers to its data blocks. It does **not** store the file name; the name lives in the directory entry. See inode numbers with `ls -i`." }
        ]
      },
      {
        title: "Permissions (chmod, chown, umask)",
        blocks: [
          { code: C`
            $ ls -l run.sh
            -rwxr-x--- 1 ana dev 2048 Nov 26 10:00 run.sh
            │└┬┘└┬┘└┬┘   └┬┘ └┬┘
            │ │  │  │     │   └─ group
            │ │  │  │     └───── owner
            │ │  │  └─ others: ---  (no access)
            │ │  └──── group:  r-x  (read + execute)
            │ └─────── owner:  rwx  (read + write + execute)
            └───────── type: - file, d directory, l symlink
          `, lang: "plaintext" },
          { table: {
            head: ["Octal", "Symbolic", "Meaning / typical use"],
            rows: [
              ["`7`", "rwx", "4 (r) + 2 (w) + 1 (x)"],
              ["`755`", "rwxr-xr-x", "Scripts, directories: everyone can read/run, only owner writes"],
              ["`644`", "rw-r--r--", "Normal files"],
              ["`600`", "rw-------", "Private files (SSH keys, passwords)"],
              ["`700`", "rwx------", "Private scripts/dirs"],
              ["`777`", "rwxrwxrwx", "Everyone can do everything. Avoid it."]
            ]
          }},
          { code: C`
            chmod 755 run.sh          # octal
            chmod u+x run.sh          # add execute for user (owner)
            chmod go-w file.txt       # remove write from group & others
            chmod -R 750 /opt/app     # recursive
            chown ana file.txt        # change owner
            chown ana:dev file.txt    # change owner and group
            chgrp dev file.txt        # change group only
            umask                     # show default mask (e.g. 0022)
          `, lang: "bash" },
          { ul: [
            "**On directories**: `r` = list contents, `w` = create/delete files inside, `x` = enter it (`cd`).",
            "**umask** is subtracted from the defaults (666 for files, 777 for dirs). With umask `022`, new files get **644** and new directories **755**.",
            "**setuid (4xxx)**: the program runs with the *owner's* privileges, e.g. `/usr/bin/passwd` (shows as `s` in the owner's x spot).",
            "**setgid (2xxx)**: runs with the group's privileges. On a directory, new files inherit the directory's group.",
            "**Sticky bit (1xxx)**: on a shared directory like `/tmp`, only a file's owner can delete it (shows as `t`)."
          ]}
        ]
      },
      {
        title: "grep: search text",
        blocks: [
          { code: C`
            grep "ERROR" app.log                 # lines containing ERROR
            grep -i "error" app.log              # case-insensitive
            grep -c "ERROR" app.log              # COUNT matching lines
            grep -n "timeout" app.log            # show line numbers
            grep -v "DEBUG" app.log              # INVERT: lines WITHOUT DEBUG
            grep -w "fail" app.log               # whole word only (not "failed")
            grep -r "db.url" /opt/app/config/    # recursive search in directory
            grep -l "ORA-" *.log                 # only list FILE NAMES that match
            grep -E "ERROR|FATAL" app.log        # extended regex: OR
            grep -A 3 -B 2 "Exception" app.log   # 3 lines After, 2 Before each match
            grep "^2026-11-26" app.log           # lines starting with the date
            grep "\.xml$" files.txt              # lines ending in .xml
            zgrep "ERROR" app.log.gz             # grep inside a gzip file
          `, lang: "bash" },
          { tip: "Regex anchors: `^` = start of line, `$` = end of line, `.` = any char, `*` = zero or more, `[0-9]` = a digit." }
        ]
      },
      {
        title: "sed, awk, cut, sort, uniq, tr",
        blocks: [
          { h: "sed: stream editor (find/replace, delete, print lines)" },
          { code: C`
            sed 's/foo/bar/' file.txt            # replace FIRST match on each line
            sed 's/foo/bar/g' file.txt           # replace ALL matches (g = global)
            sed -i 's/8080/9090/g' server.conf   # edit the file IN PLACE
            sed -i.bak 's/old/new/g' f.conf      # in place + keep backup f.conf.bak
            sed -n '10,20p' app.log              # print only lines 10-20
            sed -n '10p' app.log                 # print only line 10
            sed '5d' file.txt                    # delete line 5
            sed '/^#/d' config.ini               # delete comment lines
            sed '/^$/d' file.txt                 # delete empty lines
          `, lang: "bash" },
          { h: "awk: column/field processing" },
          { code: C`
            awk '{print $1}' file.txt                   # 1st column (whitespace-separated)
            awk '{print $1, $NF}' file.txt              # 1st and LAST column
            awk -F',' '{print $2}' data.csv             # custom delimiter (comma)
            awk -F: '{print $1}' /etc/passwd            # list all usernames
            awk '$3 > 50000' emp.txt                    # rows where column 3 > 50000
            awk '/ERROR/ {print $1, $2}' app.log        # pattern + action
            awk '{sum += $3} END {print sum}' emp.txt   # sum of column 3
            awk 'NR==5' file.txt                        # print line 5 (NR = line number)
            awk 'END {print NR}' file.txt               # count lines
            awk 'NR>1' data.csv                         # skip header row
          `, lang: "bash" },
          { h: "cut / sort / uniq / tr" },
          { code: C`
            cut -d',' -f1,3 data.csv             # fields 1 and 3, comma-delimited
            cut -c1-10 file.txt                  # characters 1 to 10

            sort names.txt                       # alphabetical
            sort -n numbers.txt                  # numeric
            sort -rn numbers.txt                 # numeric, descending
            sort -t',' -k2 data.csv              # by 2nd comma-separated field
            sort -u names.txt                    # sort + remove duplicates

            sort names.txt | uniq                # remove ADJACENT duplicates (sort first!)
            sort names.txt | uniq -c             # count each line
            sort names.txt | uniq -d             # show only duplicated lines

            tr 'a-z' 'A-Z' < file.txt            # translate to uppercase
            tr -d '\r' < win.txt > unix.txt      # remove Windows carriage returns
          `, lang: "bash" },
          { h: "Classic one-liners interviewers love" },
          { code: C`
            # Top 5 IP addresses hitting the server
            awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -5

            # Count errors by type (e.g. "ERROR [DBException] ...")
            grep "ERROR" app.log | awk '{print $3}' | sort | uniq -c | sort -rn

            # Count ERROR lines for today
            grep "^2026-11-26" app.log | grep -c "ERROR"

            # Replace a hostname in every .properties file
            sed -i 's/olddb01/newdb02/g' *.properties
          `, lang: "bash" }
        ]
      },
      {
        title: "Redirection & pipes",
        blocks: [
          { p: "Every process has 3 standard streams: **0 = stdin**, **1 = stdout**, **2 = stderr**." },
          { table: {
            head: ["Syntax", "Meaning"],
            rows: [
              ["`cmd > file`", "Send stdout to file (**overwrite**)"],
              ["`cmd >> file`", "Send stdout to file (**append**)"],
              ["`cmd < file`", "Read stdin from file"],
              ["`cmd 2> err.log`", "Send stderr to file"],
              ["`cmd > out.log 2>&1`", "Send **both** stdout and stderr to out.log"],
              ["`cmd &> out.log`", "Same as above (bash shorthand)"],
              ["`cmd 2>/dev/null`", "Discard errors (`/dev/null` is a black hole)"],
              ["`cmd1 | cmd2`", "**Pipe**: stdout of cmd1 becomes stdin of cmd2"],
              ["`cmd | tee file`", "Show output on screen **and** save it to a file"],
              ["`cmd1 && cmd2`", "Run cmd2 only if cmd1 **succeeded** (exit 0)"],
              ["`cmd1 || cmd2`", "Run cmd2 only if cmd1 **failed**"],
              ["`cmd1 ; cmd2`", "Run both regardless"]
            ]
          }},
          { warn: "Order matters: `cmd > file 2>&1` sends both streams to the file. `cmd 2>&1 > file` sends stderr to the *terminal*, because it copies where stdout pointed *at that moment*." }
        ]
      },
      {
        title: "Processes, jobs & signals",
        blocks: [
          { code: C`
            ps -ef                    # all processes (full format: UID PID PPID ... CMD)
            ps aux                    # all processes (BSD style, shows %CPU %MEM)
            ps -ef | grep java        # find a process
            pgrep -fl tomcat          # PIDs by name
            top                       # live view (P = sort by CPU, M = by memory, q = quit)
            kill 1234                 # send SIGTERM (15): ask nicely to stop
            kill -9 1234              # send SIGKILL (9): force kill, can't be caught
            pkill -f "MyApp.jar"      # kill by name/pattern
            killall java              # kill all processes with that name

            ./long_job.sh &           # run in background
            jobs                      # list background jobs of this shell
            fg %1                     # bring job 1 to foreground
            bg %1                     # resume a stopped job in background
            # Ctrl+Z = suspend (SIGTSTP)   Ctrl+C = interrupt (SIGINT)
            nohup ./server.sh > server.out 2>&1 &   # keeps running after you log out
            nice -n 10 ./batch.sh     # start with lower priority (-20 high ... 19 low)
            renice 5 -p 1234          # change priority of a running process
          `, lang: "bash" },
          { table: {
            head: ["Signal", "No.", "Meaning"],
            rows: [
              ["SIGHUP", "1", "Hangup (terminal closed); often used to reload config"],
              ["SIGINT", "2", "Interrupt from keyboard (Ctrl+C)"],
              ["SIGKILL", "9", "Kill immediately; can't be caught or ignored"],
              ["SIGTERM", "15", "Graceful termination, the **default** for `kill`"],
              ["SIGSTOP", "19", "Pause; can't be caught (Ctrl+Z sends SIGTSTP, 20)"]
            ]
          }},
          { ul: [
            "**Zombie process**: has finished, but its parent hasn't read its exit status (`wait()`). Shows as `Z` / `<defunct>`. Fix it by fixing or killing the parent.",
            "**Orphan process**: its parent died while it was still running. It's adopted by `init`/`systemd` (PID 1).",
            "**Daemon**: a background service process with no terminal (`sshd`, `crond`).",
            "**PID** = process ID, **PPID** = parent process ID."
          ]}
        ]
      },
      {
        title: "System, disk & network",
        blocks: [
          { code: C`
            df -h                     # disk space per filesystem (human-readable)
            du -sh /opt/app           # total size of a directory
            du -sh * | sort -h        # size of each item here, smallest -> largest
            free -h                   # RAM and swap usage
            uptime                    # how long up + load average (1, 5, 15 min)
            uname -a                  # kernel / OS info
            cat /etc/os-release       # distro + version
            hostname                  # machine name
            whoami  |  id             # current user / uid, groups
            who  |  w  |  last        # who is logged in / login history
            history                   # previous commands  (!123 re-runs #123, !! = last)
            which java                # path of the command that would run
            echo $PATH                # directories searched for commands
            export JAVA_HOME=/opt/jdk17   # set env var for this shell + children
            env                       # list environment variables
            alias ll='ls -la'         # create a shortcut
            man grep                  # manual page
          `, lang: "bash" },
          { code: C`
            ping dbhost               # is the host reachable?
            curl -I http://app:8080/health    # HTTP headers only
            curl -s http://app:8080/api | head
            wget http://repo/file.tar.gz       # download file
            ssh user@server           # remote login
            scp app.jar user@server:/opt/app/  # copy file to remote
            scp user@server:/var/log/app.log . # copy from remote
            ss -tulnp                 # listening ports + processes (newer)
            netstat -tulnp            # same (older)
            lsof -i :8080             # which process is using port 8080
            nc -zv dbhost 1521        # can I reach port 1521 (Oracle) on dbhost?
            telnet dbhost 1521        # older way to test a port
            nslookup app.company.com  # DNS lookup  (also: dig)
            ip addr  |  ifconfig      # network interfaces & IPs
            traceroute host           # path packets take
          `, lang: "bash" },
          { tip: "**Load average** = average number of processes running or waiting for CPU over 1, 5 and 15 minutes. Compare it with the number of CPU cores (`nproc`): a load of 4.0 on a 4-core machine means fully busy." }
        ]
      },
      {
        title: "find, tar & compression",
        blocks: [
          { code: C`
            find /var/log -name "*.log"              # by name
            find . -iname "readme*"                  # case-insensitive name
            find /opt -type d -name "conf"           # directories only (-type f = files)
            find /data -size +100M                   # files bigger than 100 MB
            find /logs -mtime -1                     # modified within the last 24 h
            find /logs -mtime +30                    # modified MORE than 30 days ago
            find /logs -name "*.log" -mtime +30 -delete      # delete old logs
            find . -name "*.tmp" -exec rm {} \;      # run a command on each result
            find / -perm 777 -type f 2>/dev/null     # world-writable files, hide errors
            find . -empty                            # empty files & dirs
            find . -newer ref.txt                    # newer than ref.txt
          `, lang: "bash" },
          { code: C`
            tar -cvf backup.tar dir/          # create archive  (c=create v=verbose f=file)
            tar -czvf backup.tar.gz dir/      # create + gzip   (z=gzip)
            tar -xzvf backup.tar.gz           # extract gzip archive (x=extract)
            tar -xzvf backup.tar.gz -C /tmp   # extract into /tmp
            tar -tvf backup.tar               # list contents without extracting
            gzip app.log   ->  app.log.gz     # compress (replaces original)
            gunzip app.log.gz                 # decompress
            zcat app.log.gz | grep ERROR      # read compressed file
            zip -r code.zip src/  |  unzip code.zip
          `, lang: "bash" }
        ]
      },
      {
        title: "Shell scripting",
        blocks: [
          { code: C`
            #!/bin/bash
            # backup.sh  -- usage: ./backup.sh <source_dir>

            if [ $# -ne 1 ]; then
                echo "Usage: $0 <source_dir>"
                exit 1
            fi

            SRC=$1
            DEST=/backup/$(date +%Y%m%d)

            if [ ! -d "$SRC" ]; then
                echo "Error: $SRC is not a directory"
                exit 2
            fi

            mkdir -p "$DEST"
            tar -czf "$DEST/backup.tar.gz" "$SRC"

            if [ $? -eq 0 ]; then
                echo "Backup OK -> $DEST"
            else
                echo "Backup FAILED" >&2
                exit 3
            fi
          `, lang: "bash" },
          { p: "Make it executable and run it: `chmod +x backup.sh` then `./backup.sh /opt/app`. Or run it without execute permission: `bash backup.sh /opt/app`." },
          { table: {
            head: ["Variable", "Meaning"],
            rows: [
              ["`$0`", "Script name"],
              ["`$1` … `$9`", "Positional arguments"],
              ["`$#`", "Number of arguments"],
              ["`$@`", "All arguments as separate words (use `\"$@\"`)"],
              ["`$*`", "All arguments as a single string"],
              ["`$?`", "Exit status of the last command (**0 = success**, non-zero = error)"],
              ["`$$`", "PID of the current shell/script"],
              ["`$!`", "PID of the last background job"]
            ]
          }},
          { table: {
            head: ["Test", "True if…"],
            rows: [
              ["`-eq -ne -gt -lt -ge -le`", "Numeric comparisons: `[ $a -gt 5 ]`"],
              ["`= !=`", "String equal / not equal: `[ \"$x\" = \"yes\" ]`"],
              ["`-z` / `-n`", "String is empty / not empty"],
              ["`-e` / `-f` / `-d`", "Path exists / is a regular file / is a directory"],
              ["`-r -w -x`", "Readable / writable / executable"],
              ["`-s`", "File exists and is not empty"]
            ]
          }},
          { code: C`
            # for loop
            for f in *.log; do
                echo "Compressing $f"
                gzip "$f"
            done

            for i in 1 2 3 4 5; do echo "$i"; done

            # while loop + arithmetic
            count=1
            while [ $count -le 5 ]; do
                echo "Attempt $count"
                count=$((count + 1))
            done

            # read a file line by line
            while read -r host; do
                ping -c 1 "$host" > /dev/null && echo "$host UP" || echo "$host DOWN"
            done < servers.txt

            # function
            greet() {
                echo "Hello, $1"
            }
            greet "Amdocs"

            # case
            case "$1" in
                start) echo "Starting" ;;
                stop)  echo "Stopping" ;;
                *)     echo "Usage: $0 {start|stop}" ;;
            esac

            # capture command output
            today=$(date +%F)
            errors=$(grep -c ERROR app.log)
            echo "$today: $errors errors"
          `, lang: "bash" }
        ]
      },
      {
        title: "cron: scheduling jobs",
        blocks: [
          { code: C`
            # ┌──────── minute       (0-59)
            # │ ┌────── hour         (0-23)
            # │ │ ┌──── day of month (1-31)
            # │ │ │ ┌── month        (1-12)
            # │ │ │ │ ┌ day of week  (0-6, Sunday = 0)
            # │ │ │ │ │
              * * * * *   command
          `, lang: "plaintext" },
          { table: {
            head: ["Entry", "Runs"],
            rows: [
              ["`0 2 * * * /opt/scripts/backup.sh`", "Every day at 2:00 AM"],
              ["`*/15 * * * * /opt/scripts/check.sh`", "Every 15 minutes"],
              ["`0 */2 * * *`", "Every 2 hours, on the hour"],
              ["`0 9 * * 1-5`", "9:00 AM Monday to Friday"],
              ["`30 18 * * 0`", "6:30 PM every Sunday"],
              ["`0 0 1 * *`", "Midnight on the 1st of every month"]
            ]
          }},
          { code: C`
            crontab -e      # edit your cron jobs
            crontab -l      # list them
            crontab -r      # remove ALL your cron jobs (careful)
            # Tip: cron has a minimal environment, so use full paths and redirect output:
            0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
          `, lang: "bash" }
        ]
      },
      {
        title: "vi / vim survival",
        blocks: [
          { table: {
            head: ["Key", "Action"],
            rows: [
              ["`i` / `a` / `o`", "Insert before cursor / after cursor / new line below"],
              ["`Esc`", "Back to command mode"],
              ["`:w` / `:q` / `:wq` / `:x`", "Save / quit / save and quit / save and quit"],
              ["`:q!`", "Quit **without saving**"],
              ["`dd` / `5dd`", "Delete (cut) line / 5 lines"],
              ["`yy` / `p`", "Copy (yank) line / paste below"],
              ["`u` / `Ctrl+r`", "Undo / redo"],
              ["`/text` then `n`", "Search forward, next match"],
              ["`gg` / `G` / `:25`", "Go to first line / last line / line 25"],
              ["`:%s/old/new/g`", "Replace all in the file"],
              ["`:set nu`", "Show line numbers"]
            ]
          }}
        ]
      },
      {
        title: "Production support scenarios",
        blocks: [
          { p: "Support and operations interviews often ask **\"what would you do if…\"**. Walk through the commands step by step:" },
          { h: "\"The application is down / not responding\"" },
          { code: C`
            ps -ef | grep -i myapp           # is the process running?
            ss -tulnp | grep 8080            # is it listening on its port?
            tail -200 /opt/app/logs/app.log  # what happened last?
            grep -iE "error|exception|fatal" app.log | tail -20
            df -h ; free -h                  # disk full? out of memory?
            nc -zv dbhost 1521               # can it reach the database?
          `, lang: "bash" },
          { h: "\"The disk is full\"" },
          { code: C`
            df -h                                   # which filesystem is at 100%?
            du -sh /opt/app/* | sort -h | tail      # biggest folders
            find /opt/app -type f -size +500M       # biggest files
            find /opt/app/logs -name "*.log" -mtime +7 -exec gzip {} \;   # compress old logs
            # careful: deleting a file a process still has open won't free space
            lsof +L1                                # deleted-but-open files
          `, lang: "bash" },
          { h: "\"The server is slow / high CPU\"" },
          { code: C`
            uptime                                  # load average vs nproc
            top                                     # press P (CPU) or M (memory)
            ps -eo pid,user,%cpu,%mem,cmd --sort=-%cpu | head
            free -h                                 # swapping?
          `, lang: "bash" },
          { tip: "Show a calm, structured approach: **check → isolate → fix → verify → document/RCA**. Mention you'd follow the escalation process and communicate with stakeholders. Interviewers care about this as much as the commands." }
        ]
      }
    ],

    qa: [
      { q: "What is the difference between Unix and Linux?", a: "Unix is the original proprietary OS from Bell Labs (1969); commercial variants include AIX, Solaris and HP-UX. Linux is a free, open-source Unix-*like* kernel (1991) used in distributions such as RHEL and Ubuntu. They share the same philosophy and nearly the same commands." },
      { q: "What is the kernel? What is the shell?", a: "The **kernel** is the core of the OS that manages hardware, memory, processes and system calls. The **shell** is a user program that interprets your commands and asks the kernel to execute them (bash, ksh, sh, zsh)." },
      { q: "What is an inode?", a: "A data structure storing a file's metadata: type, permissions, owner, group, size, timestamps, link count and pointers to its data blocks. The **file name is not in the inode**; it's in the directory entry that maps name → inode number. View it with `ls -i` or `stat file`." },
      { q: "Hard link vs soft link?", a: "A hard link is another name for the same inode: it survives deletion of the original, but can't span filesystems or point to directories. A soft (symbolic) link is a separate file containing a path: it can cross filesystems and point to directories, but it breaks if the target is deleted." },
      { q: "What does `chmod 755 file` mean?", a: "Owner = 7 (rwx), group = 5 (r-x), others = 5 (r-x). Everyone can read and execute; only the owner can modify. It's typical for scripts and directories." },
      { q: "What is umask?", a: "A mask that removes permissions from newly created files and directories. The default base is 666 for files and 777 for dirs. With `umask 022`, files become 644 and dirs 755." },
      { q: "What is the sticky bit?", a: "A permission on directories (`chmod +t` or `1777`) that lets only a file's owner (or root) delete or rename it, even if others have write permission on the directory. `/tmp` uses it." },
      { q: "How do you find which process is using port 8080?", a: "`lsof -i :8080`, `ss -tulnp | grep 8080`, or `netstat -tulnp | grep 8080`. Then `ps -fp <PID>` for details.", code: "lsof -i :8080\nss -tulnp | grep 8080", lang: "bash" },
      { q: "`kill` vs `kill -9`?", a: "`kill PID` sends **SIGTERM (15)**, which asks the process to shut down gracefully so it can clean up, close files and flush data. `kill -9 PID` sends **SIGKILL**, which the kernel enforces immediately: no cleanup, can't be caught. Use -9 only as a last resort." },
      { q: "Zombie vs orphan process?", a: "A **zombie** has finished executing but still has an entry in the process table because its parent hasn't collected its exit status. An **orphan** is still running but its parent died, so `init`/`systemd` (PID 1) adopts it." },
      { q: "How do you run a process that keeps running after you log out?", a: "`nohup ./script.sh > out.log 2>&1 &`. Alternatives: `screen`/`tmux` sessions, or run it as a proper service (systemd)." },
      { q: "Difference between `>` and `>>`?", a: "`>` redirects output and **overwrites** the file. `>>` **appends** to the end of the file. Both create the file if it doesn't exist." },
      { q: "What does `2>&1` mean?", a: "Redirect file descriptor 2 (stderr) to wherever file descriptor 1 (stdout) currently points. `cmd > out.log 2>&1` captures both normal output and errors in out.log." },
      { q: "What is `/dev/null`?", a: "A special device file that discards everything written to it and returns EOF when read. It's used to silence output: `cmd > /dev/null 2>&1`." },
      { q: "What does `$?` contain?", a: "The exit status of the last executed command. **0 means success**; any non-zero value (1–255) means some kind of failure. Scripts use it to check whether a step worked." },
      { q: "Difference between `$@` and `$*`?", a: "Unquoted they behave the same. Quoted, `\"$@\"` expands to each argument as a **separate word** (preserving spaces inside arguments), while `\"$*\"` joins all arguments into **one string**. Use `\"$@\"` to pass arguments along." },
      { q: "How do you view the last 100 lines of a log and keep watching it?", a: "`tail -n 100 -f app.log`. Combine it with grep to watch only errors: `tail -f app.log | grep --line-buffered ERROR`." },
      { q: "How do you print only the 10th line of a file?", a: "Any of: `sed -n '10p' file`, `awk 'NR==10' file`, `head -10 file | tail -1`." },
      { q: "How do you find files modified in the last 7 days?", a: "`find /path -type f -mtime -7`. `-mtime +7` means older than 7 days. For minutes, use `-mmin -60` (last hour)." },
      { q: "How do you find and delete log files older than 30 days?", a: "`find /logs -name \"*.log\" -mtime +30 -delete` or `... -exec rm {} \\;`. Run it first **without** `-delete` to see what would be removed." },
      { q: "grep vs find?", a: "`grep` searches **inside** files for text patterns. `find` searches the **filesystem** for files by name, size, type, time or permissions. Combine them: `find . -name \"*.log\" -exec grep -l ERROR {} +`." },
      { q: "How would you count how many times each error appears in a log?", a: "Extract the error field, then sort, count and sort again.", code: "grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -rn | head", lang: "bash" },
      { q: "How do you replace a word in a file without opening it?", a: "`sed -i 's/old/new/g' file`. Add a backup suffix to be safe: `sed -i.bak 's/old/new/g' file`." },
      { q: "How do you schedule a job? Explain the cron format.", a: "Use `crontab -e`. The five fields are **minute hour day-of-month month day-of-week**, followed by the command. `0 2 * * *` runs daily at 2 AM; `*/10 * * * *` runs every 10 minutes. `crontab -l` lists jobs." },
      { q: "`su` vs `sudo`?", a: "`su` switches to another user (root by default) and needs **that user's** password. `sudo` runs a single command with elevated privileges using **your own** password, if allowed in `/etc/sudoers`, and it's logged. sudo is preferred." },
      { q: "How do you check disk space and memory?", a: "Disk: `df -h` (per filesystem), `du -sh dir` (directory size). Memory: `free -h`, `top`, `vmstat`." },
      { q: "What is load average?", a: "The average number of processes running or waiting to run over the last 1, 5 and 15 minutes (shown by `uptime`/`top`). Compare it with the CPU core count: above the core count means processes are queuing." },
      { q: "How do you check the OS and kernel version?", a: "`uname -a` (kernel), `cat /etc/os-release` (distribution), `hostnamectl` on systemd systems." },
      { q: "What is a shebang?", a: "The first line of a script, `#!/bin/bash`, tells the system which interpreter runs the file when it's executed directly as `./script.sh`." },
      { q: "How do you see which processes use the most memory?", a: "`top` then press `M`, or `ps aux --sort=-%mem | head`." }
    ],

    quiz: [
      { q: "`chmod 644 file` gives which permissions?", options: ["rwxr--r--", "rw-r--r--", "rw-rw-r--", "r--r--r--"], answer: 1,
        explain: "6 = rw- (4+2), 4 = r--. Owner reads and writes; group and others read only." },
      { q: "Which signal does `kill PID` send by default?", options: ["SIGKILL (9)", "SIGHUP (1)", "SIGTERM (15)", "SIGINT (2)"], answer: 2,
        explain: "The default is SIGTERM, a graceful termination request the process can handle." },
      { q: "What does `grep -v \"DEBUG\" app.log` do?", options: ["Shows lines containing DEBUG", "Shows lines NOT containing DEBUG", "Counts DEBUG lines", "Verbose search"], answer: 1,
        explain: "`-v` inverts the match." },
      { q: "In `ls -l` output, a line starting with `l` means:", options: ["Locked file", "Large file", "Symbolic link", "Log file"], answer: 2,
        explain: "The first character is the type: `-` file, `d` directory, `l` symbolic link." },
      { q: "In a shell script, `$#` holds:", options: ["The script's PID", "The number of arguments", "The last exit status", "The first argument"], answer: 1,
        explain: "`$#` = argument count. `$$` = PID, `$?` = exit status, `$1` = first argument." },
      { q: "`./run.sh > out.log 2>&1` does what?", options: ["Only stdout goes to out.log", "Only errors go to out.log", "Both stdout and stderr go to out.log", "Appends to out.log"], answer: 2,
        explain: "stdout goes to out.log, then stderr (2) is pointed at the same place as stdout (1). Use `>>` to append." },
      { q: "When does the cron entry `0 */2 * * *` run?", options: ["Every 2 minutes", "Every 2 hours at minute 0", "At 2 AM daily", "Twice a day"], answer: 1,
        explain: "minute=0, hour=*/2 (every 2nd hour), any day, any month, any weekday." },
      { q: "Which command counts the lines in a file?", options: ["count -l", "wc -l", "lc file", "grep -l"], answer: 1,
        explain: "`wc -l` counts lines. (`grep -l` lists file names that match.)" },
      { q: "Why do you usually `sort` before `uniq`?", options: ["uniq only removes adjacent duplicates", "uniq requires numeric input", "sort removes duplicates first", "It's faster"], answer: 0,
        explain: "uniq compares only consecutive lines, so duplicates must be next to each other." },
      { q: "Which is TRUE about soft (symbolic) links?", options: ["They share the inode of the target", "They survive deletion of the target", "They can point across filesystems", "They can't point to directories"], answer: 2,
        explain: "A symlink stores a path, so it can cross filesystems and point to directories, but it breaks if the target is removed." },
      { q: "Which command changes a file's owner?", options: ["chmod", "chown", "chgrp", "usermod"], answer: 1,
        explain: "`chown user[:group] file`. chmod changes permissions; chgrp changes only the group." },
      { q: "`find /logs -mtime -1` finds files that were:", options: ["Modified more than 1 day ago", "Modified within the last 24 hours", "Created exactly 1 day ago", "Accessed in the last minute"], answer: 1,
        explain: "`-1` = less than 1 day ago, `+1` = more than 1 day ago. `-mmin` uses minutes." },
      { q: "What does `awk -F: '{print $1}' /etc/passwd` print?", options: ["Passwords", "User IDs", "Usernames", "Home directories"], answer: 2,
        explain: "/etc/passwd is colon-separated and field 1 is the username (field 6 is the home dir)." },
      { q: "An exit status of `0` means:", options: ["Failure", "Success", "Warning", "Command not found"], answer: 1,
        explain: "0 = success. Non-zero = an error (127 = command not found, 126 = not executable)." },
      { q: "Which shows the total size of a directory?", options: ["df -h dir", "du -sh dir", "ls -s dir", "size dir"], answer: 1,
        explain: "`du` = disk usage of files/dirs. `df` = free space per filesystem." },
      { q: "In vi, how do you quit **without saving**?", options: [":wq", ":x", ":q!", "ZZ"], answer: 2,
        explain: "`:q!` forces quit and discards changes. `:wq`, `:x` and `ZZ` all save." },
      { q: "`tar -xzvf app.tar.gz` will:", options: ["Create a gzip archive", "Extract a gzip archive", "List archive contents", "Compress a folder"], answer: 1,
        explain: "x = extract, z = gzip, v = verbose, f = file. Use c to create, t to list." },
      { q: "`sed 's/cat/dog/' pets.txt` replaces:", options: ["All occurrences in the file", "The first occurrence on each line", "Only the first occurrence in the file", "And saves the file"], answer: 1,
        explain: "Without `g` it replaces the first match per line. It prints to stdout and doesn't modify the file without `-i`." },
      { q: "With `umask 022`, a newly created regular file gets:", options: ["755", "644", "622", "600"], answer: 1,
        explain: "File base 666 minus 022 = 644. Directories get 777 - 022 = 755." },
      { q: "Which command lists listening ports and their processes?", options: ["ps -ef", "ss -tulnp", "df -h", "ping -l"], answer: 1,
        explain: "`ss -tulnp` (or `netstat -tulnp`): TCP, UDP, listening, numeric, with process." },
      { q: "`echo $$` prints:", options: ["The last exit code", "The PID of the current shell", "Number of args", "Two dollar signs"], answer: 1,
        explain: "`$$` expands to the current shell's process ID." },
      { q: "Which prints the **5th line** of `file.txt`?", options: ["head -5 file.txt", "tail -5 file.txt", "head -5 file.txt | tail -1", "cut -5 file.txt"], answer: 2,
        explain: "The first 5 lines, then the last of those. `sed -n '5p'` and `awk 'NR==5'` also work." },
      { q: "Which process state indicates a **zombie**?", options: ["R", "S", "Z", "T"], answer: 2,
        explain: "Z = zombie (defunct). R = running, S = sleeping, T = stopped." },
      { q: "Which command shows the most recent lines of a growing log in real time?", options: ["head -f", "cat -f", "tail -f", "less -n"], answer: 2,
        explain: "`tail -f` follows the file as new lines are appended." }
    ]
  });
})();
