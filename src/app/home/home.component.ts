import {Component, OnInit} from '@angular/core';
import {Course} from "../model/course";
import {interval, noop, Observable, of, Subscription, throwError, timer} from 'rxjs';
import {catchError, delay, delayWhen, finalize, map, retry, shareReplay, tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {MatTabChangeEvent} from '@angular/material/tabs';


@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    errorCallbacksRes: Course[];
    errorCallbacksSub: Subscription;

    catchErrorRes: Course[];
    catchErrorSub: Subscription;

    rethrowSub: Subscription;

    catchMultipleRes: Course[];
    catchMultipleSub: Subscription;

    finalizeOperatorRes: Course[];
    finalizeOperatorSub: Subscription;

    withRetryRes: Course[];
    withRetrySub: Subscription;

    delayRetryRes: Course[];
    delayRetrySub: Subscription;

    http$: Observable<Course[]>

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.http$ = this.http.get<Course[]>('/api/courses');

    }

    getCoursesErrorCallbacks() {
        this.errorCallbacksSub = this.http$
            .pipe(
                tap(() => console.log('HTTP request executed')),
                map(res => this.errorCallbacksRes = res)
            )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    //error: err => console.log('HTTP Error', err),
                    error: err => {
                        console.log('HTTP Error')
                        this.errorCallbacksRes = [];
                    },
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    unsubscribeObs() {
        this.errorCallbacksRes = null;
        this.catchErrorRes = null;
        this.catchMultipleRes = null;
        this.finalizeOperatorRes = null;
        this.withRetryRes = null;
        this.delayRetryRes = null;
        this.errorCallbacksSub?.unsubscribe();
        this.catchErrorSub?.unsubscribe();
        this.rethrowSub?.unsubscribe();
        this.catchMultipleSub?.unsubscribe()
        this.finalizeOperatorSub?.unsubscribe()
        this.withRetrySub?.unsubscribe();
        this.delayRetrySub?.unsubscribe();
    }

    getCatchAndReplaceError() {
        this.catchErrorSub = this.http$
            .pipe(
                catchError(err => of([])),
                map(res => this.catchErrorRes = res))
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    getRethrow() {
        this.rethrowSub = this.http$
            .pipe(
                catchError(err => {
                    console.log('Handling error locally and rethrowing it...', err);
                    throw new Error('new error');
                })
            )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    getCatchMultiple() {
        this.catchMultipleSub = this.http$
            .pipe(
                map(res => this.catchMultipleRes = res),
                catchError(err => {
                    console.log('caught mapping error and rethrowing', err);
                    return throwError(() => err);
                }),
                catchError(err => {
                    console.log('caught rethrown error, providing fallback value');
                    return of([])
                }),
                map(res => this.catchMultipleRes = res),
            )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    getWithFinalizeOperator() {
        this.finalizeOperatorSub = this.http$
            .pipe(
                map(res => this.finalizeOperatorRes = res['payload']),
                catchError(err => {
                    console.log('caught mapping error and rethrowing', err);
                    return throwError(() => err);
                }),
                finalize(() => console.log("first finalize() block executed")),
                catchError(err => {
                    console.log('caught rethrown error, providing fallback value');
                    return of([]);
                }),
                map(res => this.finalizeOperatorRes = res),
                finalize(() => console.log("second finalize() block executed"))
            )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    getWithRetry() {
        this.withRetrySub = this.http$.pipe(
            tap(() => console.log("HTTP request executed")),
            map(res => this.withRetryRes = Object.values(res["payload"])),
            retry({
                count: 2,
                delay: () => timer(2000)
                    .pipe(
                        tap(() => console.log('retrying...'))
                    )
            }),
            //retryWhen(errors => {
            //    return errors
            //        .pipe(
            //            tap(() => console.log('retrying...'))
            //        );
            //})
        )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

    delayWithRetry() {
        this.delayRetrySub = this.http$.pipe(
            tap(() => console.log("HTTP request executed")),
            map(res => this.delayRetryRes = Object.values(res["payload"])),

            //retry({
            //    delay: () => timer(2000)
            //        .pipe(
            //            tap(() => console.log('retrying...'))
            //        )
            //}),

            retry({
                delay: 2000,
            })

            //retryWhen(errors => {
            //    return errors
            //        .pipe(
            //            delayWhen(() => timer(2000)),
            //            tap(() => console.log('retrying...'))
            //        );
            //})
        )
            .subscribe(
                {
                    next: res => console.log('HTTP response', res),
                    error: err => console.log('HTTP Error', err),
                    complete: () => console.log('HTTP request completed.')
                }
            );
    }

}
