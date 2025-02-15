import React, { useEffect, useState } from 'react';
import { Store } from '../../hooks/useStore';
import { JobCard } from '../JobCard/JobCard';
import { QueueActions } from '../QueueActions/QueueActions';
import { StatusMenu } from '../StatusMenu/StatusMenu';
import s from './QueuePage.module.css';
import { AppJob, AppQueue } from '@bull-board/api/typings/app';
import { Pagination } from '../Pagination/Pagination';

export const QueuePage = ({
  selectedStatus,
  actions,
  queue,
}: {
  queue: AppQueue | undefined;
  actions: Store['actions'];
  selectedStatus: Store['selectedStatuses'];
}) => {
  const [pinnedJobs, setPinnedJobs] = useState([] as AppJob[]);

  // Clear pinned jobs whenever the user switches the queue
  useEffect(() => {
    setPinnedJobs([]);
  }, [queue?.name]);

  // Unpin jobs that aren't in the queue or status tab
  useEffect(() => {
    if (!queue) return;
    setPinnedJobs((prevPinnedJobs) => prevPinnedJobs
      .filter((pinnedJob: AppJob) => queue.jobs.some((job: AppJob) => job.id === pinnedJob.id))
    );
  }, [queue?.jobs]);

  if (!queue) {
    return <section>Queue Not found</section>;
  }

  const togglePinJob = (job: AppJob) => {
    const indexOfPinnedJob = pinnedJobs.findIndex(pinnedJob => pinnedJob.id === job.id)
    if (indexOfPinnedJob === -1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setPinnedJobs((prevPinnedJobs) => [job, ...prevPinnedJobs]
        .sort((a: AppJob, b: AppJob) => b!.processedOn! - a!.processedOn!)
      );
    } else {
      setPinnedJobs((prevPinnedJobs) => prevPinnedJobs.filter(pinnedJob => pinnedJob.id !== job.id));
    }
  }

  return (
    <section>
      <div className={s.stickyHeader}>
        <StatusMenu queue={queue} actions={actions} />
        <div className={s.actionContainer}>
          <div>
            {queue.jobs.length > 0 && !queue.readOnlyMode && (
              <QueueActions
                queue={queue}
                actions={actions}
                status={selectedStatus[queue.name]}
                allowRetries={queue.allowRetries}
              />
            )}
          </div>
          <Pagination pageCount={queue.pagination.pageCount} />
        </div>
      </div>
      {pinnedJobs?.length > 0 && (
        <div className={s.pinnedJobs}>
          <span className={s.pinnedJobsTitle}>Pinned</span>
          {pinnedJobs.map((job: AppJob) => (
            <JobCard
            key={job.id}
            job={job}
            status={selectedStatus[queue.name]}
            togglePinned={() => togglePinJob(job)}
            isPinned={true}
            actions={{
              cleanJob: actions.cleanJob(queue?.name)(job),
              promoteJob: actions.promoteJob(queue?.name)(job),
              retryJob: actions.retryJob(queue?.name)(job),
              getJobLogs: actions.getJobLogs(queue?.name)(job),
            }}
            readOnlyMode={queue?.readOnlyMode}
            allowRetries={queue?.allowRetries}
          />
          ))}
        </div>
      )}
      {queue.jobs
        .filter((job: AppJob) => pinnedJobs.findIndex(pinnedJob => pinnedJob.id === job.id) === -1)
        .map((job: AppJob) => (
        <JobCard
          key={job.id}
          job={job}
          status={selectedStatus[queue.name]}
          togglePinned={() => togglePinJob(job)}
          isPinned={false}
          actions={{
            cleanJob: actions.cleanJob(queue?.name)(job),
            promoteJob: actions.promoteJob(queue?.name)(job),
            retryJob: actions.retryJob(queue?.name)(job),
            getJobLogs: actions.getJobLogs(queue?.name)(job),
          }}
          readOnlyMode={queue?.readOnlyMode}
          allowRetries={queue?.allowRetries}
        />
      ))}
    </section>
  );
};
