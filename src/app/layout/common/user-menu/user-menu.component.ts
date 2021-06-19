import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { BooleanInput } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from 'app/core/user/user.model';
import { UserService } from 'app/core/user/user.service';
import {EditChannelComponent} from "../../../modules/admin/apps/channel/edit-channel/edit-channel.component";
import {MatDialog} from "@angular/material/dialog";
import {Store} from "@ngxs/store";
import {FormGroup} from "@angular/forms";
import {UpdateChannel} from "../../../store/channel/channel.actions";

@Component({
    selector       : 'user-menu',
    templateUrl    : './user-menu.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'userMenu'
})
export class UserMenuComponent implements OnInit, OnDestroy
{
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    @Input() selectChannel: any;
    @Input() adminStatus = false;
    user: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    dialogRef: any;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        public _matDialog: MatDialog,
        private store: Store,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void
    {
        // Return if user is not available
        if ( !this.user )
        {
            return;
        }

        // Update the user
        this._userService.update({
            ...this.user,
            status
        }).subscribe();
    }

    /**
     * Sign out
     */
    signOut(): void
    {
        this._router.navigate(['/sign-out']);
    };

    editChannel = (channel) => {
        this.dialogRef = this._matDialog.open(EditChannelComponent, {
            panelClass: 'mail-compose-dialog',
            disableClose: true,
            data: {channel: channel}
        });
        this.dialogRef.afterClosed().subscribe(response => {
            if (!response) {
                return;
            }
            const actionType: string = response[0];
            const formData: FormGroup = response[1];
            switch (actionType) {
                case 'save':
                    this.editCurrentChannel(formData.getRawValue());
                    break;
            }
        })
    };

    editCurrentChannel = (value) => {
        let channel = {
            id: this.selectChannel.id,
            name: value.title,
            description: value.description
        };
        this.store.dispatch(new UpdateChannel(channel))
    }
}
